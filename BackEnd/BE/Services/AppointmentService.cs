using BE.DTO;
using BE.Models;
using BE.Repositories.Interfaces;
using BE.Services.Interfaces;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;

namespace BE.Services;

public class AppointmentService : IAppointmentService
{
    private readonly IAppointmentRepository _appointmentRepository;
    private readonly IAppointmentLocationRepository _locationRepository;
    private readonly IChatUserRepository _chatUserRepository;
    private readonly INotificationService _notificationService;
    private readonly PawnderDatabaseContext _context;

    // Cấu hình nghiệp vụ
    private const int MIN_MESSAGES_REQUIRED = 6; // Số tin nhắn tối thiểu (tổng)
    private const int MIN_MESSAGES_PER_USER = 2; // Mỗi người ít nhất 2 tin
    private const int MIN_HOURS_ADVANCE = 2; // Số giờ tối thiểu trước cuộc hẹn
    private const int MAX_COUNTER_OFFERS = 3; // Số lần counter-offer tối đa
    private const double CHECK_IN_RADIUS_METERS = 100; // Bán kính check-in (mét)
    private const int CHECK_IN_BEFORE_MINUTES = 30; // Check-in trước giờ hẹn (phút)
    private const int CHECK_IN_AFTER_MINUTES = 90; // Check-in sau giờ hẹn (phút)
    private const int AUTO_NO_SHOW_MINUTES = 90; // Tự động NO_SHOW sau X phút
    private const int AUTO_COMPLETE_MINUTES = 90; // Tự động COMPLETED sau X phút

    public AppointmentService(
        IAppointmentRepository appointmentRepository,
        IAppointmentLocationRepository locationRepository,
        IChatUserRepository chatUserRepository,
        INotificationService notificationService,
        PawnderDatabaseContext context)
    {
        _appointmentRepository = appointmentRepository;
        _locationRepository = locationRepository;
        _chatUserRepository = chatUserRepository;
        _notificationService = notificationService;
        _context = context;
    }

    #region Pre-condition Checks

    public async Task<(bool IsValid, string? ErrorMessage)> ValidatePreConditionsAsync(
        int matchId,
        int inviterPetId,
        int inviteePetId,
        CancellationToken ct = default)
    {
        // 0. Kiểm tra không tự hẹn với chính mình
        if (inviterPetId == inviteePetId)
            return (false, "Không thể tạo cuộc hẹn với chính thú cưng của bạn");

        // 1. Kiểm tra Match tồn tại và đã Accepted
        var match = await _chatUserRepository.GetChatUserByMatchIdAsync(matchId, ct);
        if (match == null)
        {
            // Thử tìm với status Accepted
            var acceptedMatch = await _context.ChatUsers
                .FirstOrDefaultAsync(c => c.MatchId == matchId && c.Status == "Accepted", ct);
            if (acceptedMatch == null)
                return (false, "Hai người chưa match hoặc match không hợp lệ");
        }

        // 2. Kiểm tra đã có cuộc hẹn pending/confirmed chưa
        var existingAppointment = await _context.Set<PetAppointment>()
            .FirstOrDefaultAsync(a => 
                a.MatchId == matchId && 
                (a.Status == "pending" || a.Status == "confirmed"), ct);
        
        if (existingAppointment != null)
        {
            var statusText = existingAppointment.Status == "pending" ? "đang chờ phản hồi" : "đã được xác nhận";
            return (false, $"Đã có cuộc hẹn {statusText} với người này. Vui lòng xem trong danh sách lịch hẹn.");
        }

        // 3. Kiểm tra số tin nhắn tối thiểu (tổng + mỗi người)
        // Lấy thông tin match để biết FromUserId và ToUserId
        var matchInfo = await _context.ChatUsers
            .FirstOrDefaultAsync(m => m.MatchId == matchId, ct);
        
        if (matchInfo == null)
            return (false, "Không tìm thấy thông tin match");
        
        // Đếm tin nhắn của từng user
        var user1Messages = await _context.ChatUserContents
            .CountAsync(c => c.MatchId == matchId && c.FromUserId == matchInfo.FromUserId, ct);
        
        var user2Messages = await _context.ChatUserContents
            .CountAsync(c => c.MatchId == matchId && c.FromUserId == matchInfo.ToUserId, ct);
        
        var totalMessages = user1Messages + user2Messages;
        
        // Validation 1: Mỗi người ít nhất 2 tin
        if (user1Messages < MIN_MESSAGES_PER_USER || user2Messages < MIN_MESSAGES_PER_USER)
        {
            return (false, $"Mỗi người cần gửi ít nhất {MIN_MESSAGES_PER_USER} tin nhắn để đảm bảo có sự tương tác 2 chiều");
        }
        
        // Validation 2: Tổng ít nhất 6 tin
        if (totalMessages < MIN_MESSAGES_REQUIRED)
            return (false, $"Cần ít nhất {MIN_MESSAGES_REQUIRED} tin nhắn trước khi tạo cuộc hẹn. Hiện có: {totalMessages}");

        // 4. Kiểm tra pet profile đầy đủ
        var inviterProfileComplete = await _appointmentRepository.IsPetProfileCompleteAsync(inviterPetId, ct);
        if (!inviterProfileComplete)
            return (false, "Hồ sơ thú cưng của bạn chưa đầy đủ (cần có tên, giống loài và ảnh)");

        var inviteeProfileComplete = await _appointmentRepository.IsPetProfileCompleteAsync(inviteePetId, ct);
        if (!inviteeProfileComplete)
            return (false, "Hồ sơ thú cưng của đối phương chưa đầy đủ");

        return (true, null);
    }

    #endregion

    #region Appointment CRUD

    public async Task<AppointmentResponse> CreateAppointmentAsync(
        int userId,
        CreateAppointmentRequest request,
        CancellationToken ct = default)
    {
        // Validate pre-conditions
        var (isValid, errorMessage) = await ValidatePreConditionsAsync(
            request.MatchId, request.InviterPetId, request.InviteePetId, ct);
        
        if (!isValid)
            throw new InvalidOperationException(errorMessage);

        // Validate thời gian (tối thiểu 2 tiếng từ hiện tại)
        // Chuyển về giờ Việt Nam (GMT+7) để so sánh
        var nowVietnam = DateTime.UtcNow.AddHours(7);
        var appointmentVietnam = request.AppointmentDateTime.Kind == DateTimeKind.Utc
            ? request.AppointmentDateTime.AddHours(7)
            : request.AppointmentDateTime;
        var minDateTime = nowVietnam.AddHours(MIN_HOURS_ADVANCE);

        if (appointmentVietnam < minDateTime)
            throw new ArgumentException($"Thời gian hẹn phải cách hiện tại ít nhất {MIN_HOURS_ADVANCE} tiếng");

        // Xử lý địa điểm
        int? locationId = request.LocationId;
        if (locationId.HasValue)
        {
            // Validate LocationId tồn tại
            var existingLocation = await _locationRepository.GetByIdAsync(locationId.Value, ct);
            if (existingLocation == null)
                throw new ArgumentException("Địa điểm không tồn tại");
        }
        else if (request.CustomLocation != null)
        {
            var newLocation = await CreateLocationAsync(request.CustomLocation, ct);
            locationId = newLocation.LocationId;
        }

        // Lấy thông tin user
        var inviterPet = await _context.Pets.Include(p => p.User)
            .FirstOrDefaultAsync(p => p.PetId == request.InviterPetId, ct);
        var inviteePet = await _context.Pets.Include(p => p.User)
            .FirstOrDefaultAsync(p => p.PetId == request.InviteePetId, ct);

        if (inviterPet?.User == null || inviteePet?.User == null)
            throw new InvalidOperationException("Không tìm thấy thông tin thú cưng hoặc chủ");

        // Tạo cuộc hẹn
        // Chuyển DateTime về local time (không có UTC kind) để lưu vào PostgreSQL
        var appointmentDateTimeLocal = request.AppointmentDateTime.Kind == DateTimeKind.Utc
            ? DateTime.SpecifyKind(request.AppointmentDateTime.AddHours(7), DateTimeKind.Unspecified)
            : DateTime.SpecifyKind(request.AppointmentDateTime, DateTimeKind.Unspecified);
            
        var appointment = new PetAppointment
        {
            MatchId = request.MatchId,
            InviterPetId = request.InviterPetId,
            InviteePetId = request.InviteePetId,
            InviterUserId = inviterPet.UserId!.Value,
            InviteeUserId = inviteePet.UserId!.Value,
            AppointmentDateTime = appointmentDateTimeLocal,
            LocationId = locationId,
            ActivityType = request.ActivityType,
            Status = "pending",
            CurrentDecisionUserId = inviteePet.UserId, // Invitee decides first
            CounterOfferCount = 0,
            CreatedAt = DateTime.Now,
            UpdatedAt = DateTime.Now
        };

        await _appointmentRepository.AddAsync(appointment, ct);

        // Gửi thông báo cho invitee - dùng giờ Việt Nam
        await _notificationService.CreateNotificationAsync(new NotificationDto_1
        {
            UserId = inviteePet.UserId,
            Title = "Lời mời gặp gỡ mới! 🐾",
            Message = $"Bé {inviterPet.Name} muốn hẹn gặp bé {inviteePet.Name} vào {appointmentDateTimeLocal:dd/MM/yyyy HH:mm}",
            Type = "appointment_invite"
        }, ct);

        return await GetAppointmentByIdAsync(appointment.AppointmentId, ct) 
            ?? throw new InvalidOperationException("Không thể tạo cuộc hẹn");
    }

    public async Task<AppointmentResponse?> GetAppointmentByIdAsync(int appointmentId, CancellationToken ct = default)
    {
        var appointment = await _appointmentRepository.GetByIdWithDetailsAsync(appointmentId, ct);
        return appointment != null ? MapToResponse(appointment) : null;
    }

    public async Task<IEnumerable<AppointmentResponse>> GetAppointmentsByMatchIdAsync(int matchId, CancellationToken ct = default)
    {
        var appointments = await _appointmentRepository.GetByMatchIdAsync(matchId, ct);
        return appointments.Select(MapToResponse);
    }

    public async Task<IEnumerable<AppointmentResponse>> GetAppointmentsByUserIdAsync(int userId, CancellationToken ct = default)
    {
        var appointments = await _appointmentRepository.GetByUserIdAsync(userId, ct);
        return appointments.Select(MapToResponse);
    }

    #endregion

    #region Appointment Actions

    public async Task<AppointmentResponse> RespondToAppointmentAsync(
        int userId,
        RespondAppointmentRequest request,
        CancellationToken ct = default)
    {
        var appointment = await _appointmentRepository.GetByIdWithDetailsAsync(request.AppointmentId, ct)
            ?? throw new KeyNotFoundException("Không tìm thấy cuộc hẹn");

        // Kiểm tra quyền quyết định
        if (appointment.CurrentDecisionUserId != userId)
            throw new UnauthorizedAccessException("Bạn không có quyền phản hồi cuộc hẹn này");

        if (appointment.Status != "pending")
            throw new InvalidOperationException($"Cuộc hẹn đang ở trạng thái '{appointment.Status}', không thể phản hồi");

        // Validate DeclineReason nếu từ chối
        if (!request.Accept && string.IsNullOrWhiteSpace(request.DeclineReason))
            throw new ArgumentException("Vui lòng nhập lý do từ chối");

        if (request.Accept)
        {
            appointment.Status = "confirmed";
            appointment.CurrentDecisionUserId = null;

            // Xác định ai là người xác nhận và ai là người nhận thông báo
            var confirmerId = userId;
            var otherUserId = userId == appointment.InviterUserId 
                ? appointment.InviteeUserId 
                : appointment.InviterUserId;
            var confirmerPetName = userId == appointment.InviterUserId 
                ? appointment.InviterPet?.Name 
                : appointment.InviteePet?.Name;
            var otherPetName = userId == appointment.InviterUserId 
                ? appointment.InviteePet?.Name 
                : appointment.InviterPet?.Name;

            // Thông báo cho người còn lại (người nhận được xác nhận)
            await _notificationService.CreateNotificationAsync(new NotificationDto_1
            {
                UserId = otherUserId,
                Title = "Cuộc hẹn được xác nhận! 🎉",
                Message = $"Bé {confirmerPetName} đã đồng ý gặp gỡ vào {appointment.AppointmentDateTime:dd/MM/yyyy HH:mm}",
                Type = "appointment_accepted"
            }, ct);

            // Thông báo cho người xác nhận (xác nhận đã xác nhận thành công)
            await _notificationService.CreateNotificationAsync(new NotificationDto_1
            {
                UserId = confirmerId,
                Title = "Bạn đã xác nhận cuộc hẹn! 🎉",
                Message = $"Cuộc hẹn với bé {otherPetName} vào {appointment.AppointmentDateTime:dd/MM/yyyy HH:mm} đã được xác nhận",
                Type = "appointment_accepted"
            }, ct);
        }
        else
        {
            appointment.Status = "rejected";
            appointment.CancelReason = request.DeclineReason;
            appointment.CancelledBy = userId;

            // Xác định ai là người từ chối và ai là người nhận thông báo
            var rejecterId = userId;
            var otherUserId = userId == appointment.InviterUserId 
                ? appointment.InviteeUserId 
                : appointment.InviterUserId;
            var rejecterPetName = userId == appointment.InviterUserId 
                ? appointment.InviterPet?.Name 
                : appointment.InviteePet?.Name;
            var otherPetName = userId == appointment.InviterUserId 
                ? appointment.InviteePet?.Name 
                : appointment.InviterPet?.Name;

            // Thông báo cho người còn lại (người bị từ chối)
            await _notificationService.CreateNotificationAsync(new NotificationDto_1
            {
                UserId = otherUserId,
                Title = "Cuộc hẹn bị từ chối 😢",
                Message = $"Bé {rejecterPetName} không thể tham gia cuộc hẹn. Lý do: {request.DeclineReason ?? "Không có"}",
                Type = "appointment_rejected"
            }, ct);

            // Thông báo cho người từ chối (xác nhận đã từ chối)
            await _notificationService.CreateNotificationAsync(new NotificationDto_1
            {
                UserId = rejecterId,
                Title = "Bạn đã từ chối cuộc hẹn",
                Message = $"Bạn đã từ chối cuộc hẹn với bé {otherPetName}",
                Type = "appointment_rejected"
            }, ct);
        }

        appointment.UpdatedAt = DateTime.Now;
        await _appointmentRepository.UpdateAsync(appointment, ct);

        return MapToResponse(appointment);
    }

    public async Task<AppointmentResponse> CounterOfferAsync(
        int userId,
        CounterOfferRequest request,
        CancellationToken ct = default)
    {
        var appointment = await _appointmentRepository.GetByIdWithDetailsAsync(request.AppointmentId, ct)
            ?? throw new KeyNotFoundException("Không tìm thấy cuộc hẹn");

        // Kiểm tra quyền
        if (appointment.CurrentDecisionUserId != userId)
            throw new UnauthorizedAccessException("Bạn không có quyền đề xuất lại cuộc hẹn này");

        if (appointment.Status != "pending")
            throw new InvalidOperationException("Cuộc hẹn đã không còn ở trạng thái chờ phản hồi");

        // Kiểm tra giới hạn counter-offer
        if (appointment.CounterOfferCount >= MAX_COUNTER_OFFERS)
            throw new InvalidOperationException($"Đã đạt giới hạn {MAX_COUNTER_OFFERS} lần đề xuất lại");

        // Validate phải có ít nhất 1 thay đổi
        if (!request.NewDateTime.HasValue && !request.NewLocationId.HasValue && request.NewCustomLocation == null)
            throw new ArgumentException("Vui lòng đề xuất thời gian hoặc địa điểm mới");

        // Validate LocationId nếu có
        if (request.NewLocationId.HasValue)
        {
            var existingLocation = await _locationRepository.GetByIdAsync(request.NewLocationId.Value, ct);
            if (existingLocation == null)
                throw new ArgumentException("Địa điểm không tồn tại");
        }

        // Cập nhật thông tin
        if (request.NewDateTime.HasValue)
        {
            var nowVietnam = DateTime.UtcNow.AddHours(7);
            var newDateTimeVietnam = request.NewDateTime.Value.Kind == DateTimeKind.Utc
                ? request.NewDateTime.Value.AddHours(7)
                : request.NewDateTime.Value;
            var minDateTime = nowVietnam.AddHours(MIN_HOURS_ADVANCE);

            if (newDateTimeVietnam < minDateTime)
                throw new ArgumentException($"Thời gian hẹn phải cách hiện tại ít nhất {MIN_HOURS_ADVANCE} tiếng");

            // Chuyển về local time để lưu vào PostgreSQL
            var newDateTimeLocal = request.NewDateTime.Value.Kind == DateTimeKind.Utc
                ? DateTime.SpecifyKind(request.NewDateTime.Value.AddHours(7), DateTimeKind.Unspecified)
                : DateTime.SpecifyKind(request.NewDateTime.Value, DateTimeKind.Unspecified);
            appointment.AppointmentDateTime = newDateTimeLocal;
        }

        if (request.NewLocationId.HasValue)
        {
            appointment.LocationId = request.NewLocationId.Value;
        }
        else if (request.NewCustomLocation != null)
        {
            var newLocation = await CreateLocationAsync(request.NewCustomLocation, ct);
            appointment.LocationId = newLocation.LocationId;
        }

        // Chuyển quyền quyết định sang người còn lại
        appointment.CurrentDecisionUserId = appointment.CurrentDecisionUserId == appointment.InviterUserId
            ? appointment.InviteeUserId
            : appointment.InviterUserId;
        
        appointment.CounterOfferCount = (appointment.CounterOfferCount ?? 0) + 1;
        appointment.UpdatedAt = DateTime.Now;

        await _appointmentRepository.UpdateAsync(appointment, ct);

        // Thông báo cho người nhận
        await _notificationService.CreateNotificationAsync(new NotificationDto_1
        {
            UserId = appointment.CurrentDecisionUserId,
            Title = "Có đề xuất mới cho cuộc hẹn! 📝",
            Message = $"Đối phương đã đề xuất thời gian/địa điểm mới cho cuộc hẹn",
            Type = "appointment_counter_offer"
        }, ct);

        return MapToResponse(appointment);
    }

    public async Task<AppointmentResponse> CancelAppointmentAsync(
        int userId,
        CancelAppointmentRequest request,
        CancellationToken ct = default)
    {
        var appointment = await _appointmentRepository.GetByIdWithDetailsAsync(request.AppointmentId, ct)
            ?? throw new KeyNotFoundException("Không tìm thấy cuộc hẹn");

        // Kiểm tra quyền hủy (inviter hoặc invitee)
        if (appointment.InviterUserId != userId && appointment.InviteeUserId != userId)
            throw new UnauthorizedAccessException("Bạn không có quyền hủy cuộc hẹn này");

        if (appointment.Status == "completed" || appointment.Status == "cancelled")
            throw new InvalidOperationException("Cuộc hẹn đã hoàn thành hoặc đã bị hủy");

        // Cảnh báo nếu hủy sát giờ (trong vòng 2 tiếng)
        var isLastMinuteCancel = appointment.AppointmentDateTime <= DateTime.Now.AddHours(2);

        appointment.Status = "cancelled";
        appointment.CancelledBy = userId;
        appointment.CancelReason = request.Reason + (isLastMinuteCancel ? " (Hủy sát giờ)" : "");
        appointment.UpdatedAt = DateTime.Now;

        await _appointmentRepository.UpdateAsync(appointment, ct);

        // Thông báo cho người còn lại
        var otherUserId = userId == appointment.InviterUserId 
            ? appointment.InviteeUserId 
            : appointment.InviterUserId;

        await _notificationService.CreateNotificationAsync(new NotificationDto_1
        {
            UserId = otherUserId,
            Title = isLastMinuteCancel ? "Cuộc hẹn bị hủy sát giờ ⚠️" : "Cuộc hẹn bị hủy",
            Message = $"Cuộc hẹn đã bị hủy. Lý do: {request.Reason}",
            Type = "appointment_cancelled"
        }, ct);

        return MapToResponse(appointment);
    }

    public async Task<AppointmentResponse> CheckInAsync(
        int userId,
        CheckInRequest request,
        CancellationToken ct = default)
    {
        var appointment = await _appointmentRepository.GetByIdWithDetailsAsync(request.AppointmentId, ct)
            ?? throw new KeyNotFoundException("Không tìm thấy cuộc hẹn");

        if (appointment.Status != "confirmed" && appointment.Status != "on_going")
            throw new InvalidOperationException("Cuộc hẹn chưa được xác nhận hoặc đã kết thúc");

        // Kiểm tra thời gian check-in (30 phút trước - 90 phút sau giờ hẹn)
        var now = DateTime.Now;
        var earliestCheckIn = appointment.AppointmentDateTime.AddMinutes(-CHECK_IN_BEFORE_MINUTES);
        var latestCheckIn = appointment.AppointmentDateTime.AddMinutes(CHECK_IN_AFTER_MINUTES);

        if (now < earliestCheckIn)
            throw new InvalidOperationException($"Chưa đến giờ check-in. Bạn có thể check-in từ {earliestCheckIn:HH:mm} (trước giờ hẹn {CHECK_IN_BEFORE_MINUTES} phút)");

        if (now > latestCheckIn)
            throw new InvalidOperationException($"Đã quá thời gian check-in. Thời hạn check-in là {latestCheckIn:HH:mm} (sau giờ hẹn {CHECK_IN_AFTER_MINUTES} phút)");

        // Kiểm tra vị trí (nếu có location)
        if (appointment.Location != null)
        {
            var distance = CalculateDistance(
                request.Latitude, request.Longitude,
                appointment.Location.Latitude, appointment.Location.Longitude);

            if (distance > CHECK_IN_RADIUS_METERS)
                throw new InvalidOperationException($"Bạn đang cách địa điểm hẹn {distance:N0}m. Cần ở trong bán kính {CHECK_IN_RADIUS_METERS}m để check-in");
        }

        // Cập nhật check-in
        var otherUserId = 0;
        var checkedInPetName = "";
        
        if (userId == appointment.InviterUserId)
        {
            appointment.InviterCheckedIn = true;
            appointment.InviterCheckInTime = now;
            otherUserId = appointment.InviteeUserId;
            checkedInPetName = appointment.InviterPet?.Name ?? "Bé nhà bạn";
        }
        else if (userId == appointment.InviteeUserId)
        {
            appointment.InviteeCheckedIn = true;
            appointment.InviteeCheckInTime = now;
            otherUserId = appointment.InviterUserId;
            checkedInPetName = appointment.InviteePet?.Name ?? "Đối phương";
        }
        else
        {
            throw new UnauthorizedAccessException("Bạn không phải thành viên của cuộc hẹn này");
        }

        // Nếu cả 2 đã check-in -> chuyển sang on_going
        if (appointment.InviterCheckedIn == true && appointment.InviteeCheckedIn == true)
        {
            appointment.Status = "on_going";

            // Thông báo cho cả 2 - cuộc hẹn bắt đầu
            await _notificationService.CreateNotificationAsync(new NotificationDto_1
            {
                UserId = appointment.InviterUserId,
                Title = "Cuộc hẹn đang diễn ra! 🎉",
                Message = "Cả hai đã check-in. Chúc các bé có buổi gặp vui vẻ!",
                Type = "appointment_ongoing"
            }, ct);

            await _notificationService.CreateNotificationAsync(new NotificationDto_1
            {
                UserId = appointment.InviteeUserId,
                Title = "Cuộc hẹn đang diễn ra! 🎉",
                Message = "Cả hai đã check-in. Chúc các bé có buổi gặp vui vẻ!",
                Type = "appointment_ongoing"
            }, ct);
        }
        else
        {
            // Chỉ một người check-in - thông báo cho người còn lại
            await _notificationService.CreateNotificationAsync(new NotificationDto_1
            {
                UserId = otherUserId,
                Title = "Đối phương đã check-in! 📍",
                Message = $"Bé {checkedInPetName} đã đến địa điểm hẹn. Hãy nhanh chân check-in nhé!",
                Type = "appointment_checkin"
            }, ct);
        }

        appointment.UpdatedAt = now;
        await _appointmentRepository.UpdateAsync(appointment, ct);

        return MapToResponse(appointment);
    }

    public async Task<AppointmentResponse> CompleteAppointmentAsync(
        int userId,
        int appointmentId,
        CancellationToken ct = default)
    {
        var appointment = await _appointmentRepository.GetByIdWithDetailsAsync(appointmentId, ct)
            ?? throw new KeyNotFoundException("Không tìm thấy cuộc hẹn");

        // Kiểm tra quyền (inviter hoặc invitee)
        if (appointment.InviterUserId != userId && appointment.InviteeUserId != userId)
            throw new UnauthorizedAccessException("Bạn không có quyền kết thúc cuộc hẹn này");

        if (appointment.Status != "on_going")
            throw new InvalidOperationException("Chỉ có thể kết thúc cuộc hẹn đang diễn ra");

        // Kiểm tra thời gian: chỉ cho kết thúc sau giờ hẹn
        if (DateTime.Now < appointment.AppointmentDateTime)
            throw new InvalidOperationException("Chưa đến giờ hẹn, không thể kết thúc");

        appointment.Status = "completed";
        appointment.UpdatedAt = DateTime.Now;

        await _appointmentRepository.UpdateAsync(appointment, ct);

        // Thông báo cho người còn lại
        var otherUserId = userId == appointment.InviterUserId 
            ? appointment.InviteeUserId 
            : appointment.InviterUserId;

        await _notificationService.CreateNotificationAsync(new NotificationDto_1
        {
            UserId = otherUserId,
            Title = "Cuộc hẹn đã kết thúc 🎊",
            Message = "Cuộc hẹn đã hoàn thành. Cảm ơn bạn đã sử dụng dịch vụ!",
            Type = "appointment_completed"
        }, ct);

        // Thông báo cho người kết thúc
        await _notificationService.CreateNotificationAsync(new NotificationDto_1
        {
            UserId = userId,
            Title = "Cuộc hẹn đã kết thúc 🎊",
            Message = "Cuộc hẹn đã hoàn thành. Cảm ơn bạn đã sử dụng dịch vụ!",
            Type = "appointment_completed"
        }, ct);

        return MapToResponse(appointment);
    }

    /// <summary>
    /// Xử lý các cuộc hẹn quá hạn (gọi từ Background Service)
    /// </summary>
    public async Task ProcessExpiredAppointmentsAsync(CancellationToken ct = default)
    {
        // Sử dụng Vietnam timezone (UTC+7) vì database lưu giờ Vietnam
        var now = GetVietnamTime();
        var noShowThreshold = now.AddMinutes(-AUTO_NO_SHOW_MINUTES);
        var completeThreshold = now.AddMinutes(-AUTO_COMPLETE_MINUTES);

        Console.WriteLine($"[AppointmentExpiration] Checking at Vietnam time: {now:yyyy-MM-dd HH:mm:ss}");
        Console.WriteLine($"[AppointmentExpiration] NO_SHOW threshold: {noShowThreshold:yyyy-MM-dd HH:mm:ss}");

        // 0. Xử lý EXPIRED: Cuộc hẹn pending nhưng đã quá giờ hẹn
        var pendingExpiredAppointments = await _context.Set<PetAppointment>()
            .Where(a => a.Status == "pending" && a.AppointmentDateTime <= now)
            .ToListAsync(ct);

        Console.WriteLine($"[AppointmentExpiration] Found {pendingExpiredAppointments.Count} pending appointments to mark as EXPIRED");

        foreach (var appointment in pendingExpiredAppointments)
        {
            Console.WriteLine($"[AppointmentExpiration] Marking appointment {appointment.AppointmentId} as EXPIRED (scheduled: {appointment.AppointmentDateTime:yyyy-MM-dd HH:mm:ss})");
            
            appointment.Status = "expired";
            appointment.UpdatedAt = now;

            // Thông báo cho cả 2
            await _notificationService.CreateNotificationAsync(new NotificationDto_1
            {
                UserId = appointment.InviterUserId,
                Title = "Cuộc hẹn đã hết hạn ⏰",
                Message = "Cuộc hẹn đã tự động hết hạn do không được phản hồi trước giờ hẹn",
                Type = "appointment_expired"
            }, ct);

            await _notificationService.CreateNotificationAsync(new NotificationDto_1
            {
                UserId = appointment.InviteeUserId,
                Title = "Cuộc hẹn đã hết hạn ⏰",
                Message = "Cuộc hẹn đã tự động hết hạn do không được phản hồi trước giờ hẹn",
                Type = "appointment_expired"
            }, ct);
        }

        // 1. Xử lý NO_SHOW: Cuộc hẹn confirmed nhưng thiếu người check-in sau 90 phút
        var confirmedAppointments = await _context.Set<PetAppointment>()
            .Where(a => a.Status == "confirmed" && a.AppointmentDateTime <= noShowThreshold)
            .ToListAsync(ct);

        Console.WriteLine($"[AppointmentExpiration] Found {confirmedAppointments.Count} confirmed appointments to mark as NO_SHOW");

        foreach (var appointment in confirmedAppointments)
        {
            Console.WriteLine($"[AppointmentExpiration] Marking appointment {appointment.AppointmentId} as NO_SHOW (scheduled: {appointment.AppointmentDateTime:yyyy-MM-dd HH:mm:ss})");
            
            appointment.Status = "no_show";
            appointment.UpdatedAt = now;

            // Thông báo cho cả 2
            await _notificationService.CreateNotificationAsync(new NotificationDto_1
            {
                UserId = appointment.InviterUserId,
                Title = "Cuộc hẹn không thành ⚠️",
                Message = "Cuộc hẹn đã bị hủy do không có ai check-in đúng giờ",
                Type = "appointment_no_show"
            }, ct);

            await _notificationService.CreateNotificationAsync(new NotificationDto_1
            {
                UserId = appointment.InviteeUserId,
                Title = "Cuộc hẹn không thành ⚠️",
                Message = "Cuộc hẹn đã bị hủy do không có ai check-in đúng giờ",
                Type = "appointment_no_show"
            }, ct);
        }

        // 2. Xử lý AUTO_COMPLETE: Cuộc hẹn on_going sau 90 phút
        var ongoingAppointments = await _context.Set<PetAppointment>()
            .Where(a => a.Status == "on_going" && a.AppointmentDateTime <= completeThreshold)
            .ToListAsync(ct);

        Console.WriteLine($"[AppointmentExpiration] Found {ongoingAppointments.Count} on_going appointments to auto-complete");

        foreach (var appointment in ongoingAppointments)
        {
            Console.WriteLine($"[AppointmentExpiration] Auto-completing appointment {appointment.AppointmentId}");
            
            appointment.Status = "completed";
            appointment.UpdatedAt = now;

            // Thông báo cho cả 2
            await _notificationService.CreateNotificationAsync(new NotificationDto_1
            {
                UserId = appointment.InviterUserId,
                Title = "Cuộc hẹn hoàn thành 🎊",
                Message = "Cuộc hẹn đã tự động hoàn thành. Cảm ơn bạn!",
                Type = "appointment_completed"
            }, ct);

            await _notificationService.CreateNotificationAsync(new NotificationDto_1
            {
                UserId = appointment.InviteeUserId,
                Title = "Cuộc hẹn hoàn thành 🎊",
                Message = "Cuộc hẹn đã tự động hoàn thành. Cảm ơn bạn!",
                Type = "appointment_completed"
            }, ct);
        }

        await _context.SaveChangesAsync(ct);
    }

    /// <summary>
    /// Get current time in Vietnam timezone (UTC+7)
    /// Works on both Windows and Linux
    /// </summary>
    private static DateTime GetVietnamTime()
    {
        try
        {
            // Try Windows timezone ID first
            var vietnamTimeZone = TimeZoneInfo.FindSystemTimeZoneById("SE Asia Standard Time");
            return TimeZoneInfo.ConvertTimeFromUtc(DateTime.UtcNow, vietnamTimeZone);
        }
        catch (TimeZoneNotFoundException)
        {
            try
            {
                // Try Linux/IANA timezone ID
                var vietnamTimeZone = TimeZoneInfo.FindSystemTimeZoneById("Asia/Ho_Chi_Minh");
                return TimeZoneInfo.ConvertTimeFromUtc(DateTime.UtcNow, vietnamTimeZone);
            }
            catch (TimeZoneNotFoundException)
            {
                // Fallback: manually add 7 hours to UTC
                return DateTime.UtcNow.AddHours(7);
            }
        }
    }

    #endregion

    #region Location

    public async Task<LocationResponse> CreateLocationAsync(CreateLocationRequest request, CancellationToken ct = default)
    {
        // Kiểm tra trùng lặp theo GooglePlaceId
        if (!string.IsNullOrEmpty(request.GooglePlaceId))
        {
            var existing = await _locationRepository.GetByGooglePlaceIdAsync(request.GooglePlaceId, ct);
            if (existing != null)
                return MapLocationToResponse(existing);
        }

        var location = new PetAppointmentLocation
        {
            Name = request.Name,
            Address = request.Address,
            Latitude = request.Latitude,
            Longitude = request.Longitude,
            City = request.City,
            District = request.District,
            IsPetFriendly = true,
            PlaceType = request.PlaceType ?? "custom",
            GooglePlaceId = request.GooglePlaceId,
            CreatedAt = DateTime.Now,
            UpdatedAt = DateTime.Now
        };

        await _locationRepository.AddAsync(location, ct);
        return MapLocationToResponse(location);
    }

    public async Task<IEnumerable<LocationResponse>> GetRecentLocationsAsync(int userId, int limit = 10, CancellationToken ct = default)
    {
        // Lấy các locations từ appointments của user (distinct, sắp xếp theo thời gian mới nhất)
        var recentLocations = await _context.Set<PetAppointment>()
            .Where(a => (a.InviterUserId == userId || a.InviteeUserId == userId) 
                        && a.LocationId != null 
                        && a.Location != null)
            .OrderByDescending(a => a.CreatedAt)
            .Select(a => a.Location!)
            .Distinct()
            .Take(limit)
            .ToListAsync(ct);

        return recentLocations.Select(MapLocationToResponse);
    }

    #endregion

    #region Private Helpers

    private static AppointmentResponse MapToResponse(PetAppointment a)
    {
        return new AppointmentResponse
        {
            AppointmentId = a.AppointmentId,
            MatchId = a.MatchId,
            InviterPetId = a.InviterPetId,
            InviterPetName = a.InviterPet?.Name,
            InviterUserId = a.InviterUserId,
            InviterUserName = a.InviterUser?.FullName,
            InviteePetId = a.InviteePetId,
            InviteePetName = a.InviteePet?.Name,
            InviteeUserId = a.InviteeUserId,
            InviteeUserName = a.InviteeUser?.FullName,
            AppointmentDateTime = a.AppointmentDateTime,
            Location = a.Location != null ? MapLocationToResponse(a.Location) : null,
            ActivityType = a.ActivityType,
            Status = a.Status,
            CurrentDecisionUserId = a.CurrentDecisionUserId,
            CounterOfferCount = a.CounterOfferCount ?? 0,
            InviterCheckedIn = a.InviterCheckedIn ?? false,
            InviteeCheckedIn = a.InviteeCheckedIn ?? false,
            InviterCheckInTime = a.InviterCheckInTime,
            InviteeCheckInTime = a.InviteeCheckInTime,
            CancelledBy = a.CancelledBy,
            CancelReason = a.CancelReason,
            CreatedAt = a.CreatedAt ?? DateTime.Now,
            UpdatedAt = a.UpdatedAt ?? DateTime.Now
        };
    }

    private static LocationResponse MapLocationToResponse(PetAppointmentLocation l)
    {
        return new LocationResponse
        {
            LocationId = l.LocationId,
            Name = l.Name,
            Address = l.Address,
            Latitude = l.Latitude,
            Longitude = l.Longitude,
            City = l.City,
            District = l.District,
            IsPetFriendly = l.IsPetFriendly ?? true,
            PlaceType = l.PlaceType,
            GooglePlaceId = l.GooglePlaceId
        };
    }

    /// <summary>
    /// Tính khoảng cách giữa 2 tọa độ (mét) sử dụng Haversine formula
    /// </summary>
    private static double CalculateDistance(decimal lat1, decimal lon1, decimal lat2, decimal lon2)
    {
        const double R = 6371000; // Bán kính Trái Đất (mét)
        
        var dLat = ToRadians((double)(lat2 - lat1));
        var dLon = ToRadians((double)(lon2 - lon1));
        
        var a = Math.Sin(dLat / 2) * Math.Sin(dLat / 2) +
                Math.Cos(ToRadians((double)lat1)) * Math.Cos(ToRadians((double)lat2)) *
                Math.Sin(dLon / 2) * Math.Sin(dLon / 2);
        
        var c = 2 * Math.Atan2(Math.Sqrt(a), Math.Sqrt(1 - a));
        
        return R * c;
    }

    private static double ToRadians(double degrees) => degrees * Math.PI / 180;

    #endregion
}
