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
    private const int MIN_MESSAGES_REQUIRED = 10; // Số tin nhắn tối thiểu
    private const int MIN_HOURS_ADVANCE = 2; // Số giờ tối thiểu trước cuộc hẹn
    private const int MAX_COUNTER_OFFERS = 3; // Số lần counter-offer tối đa
    private const double CHECK_IN_RADIUS_METERS = 100; // Bán kính check-in (mét)

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

        // 2. Kiểm tra số tin nhắn tối thiểu
        var messageCount = await _appointmentRepository.CountMessagesBetweenUsersAsync(matchId, ct);
        if (messageCount < MIN_MESSAGES_REQUIRED)
            return (false, $"Cần ít nhất {MIN_MESSAGES_REQUIRED} tin nhắn trước khi tạo cuộc hẹn. Hiện có: {messageCount}");

        // 3. Kiểm tra pet profile đầy đủ
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
        var minDateTime = DateTime.Now.AddHours(MIN_HOURS_ADVANCE);
        if (request.AppointmentDateTime < minDateTime)
            throw new ArgumentException($"Thời gian hẹn phải cách hiện tại ít nhất {MIN_HOURS_ADVANCE} tiếng");

        // Xử lý địa điểm
        int? locationId = request.LocationId;
        if (locationId == null && request.CustomLocation != null)
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
        var appointment = new PetAppointment
        {
            MatchId = request.MatchId,
            InviterPetId = request.InviterPetId,
            InviteePetId = request.InviteePetId,
            InviterUserId = inviterPet.UserId!.Value,
            InviteeUserId = inviteePet.UserId!.Value,
            AppointmentDateTime = request.AppointmentDateTime,
            LocationId = locationId,
            ActivityType = request.ActivityType,
            Status = "pending",
            CurrentDecisionUserId = inviteePet.UserId, // Invitee decides first
            CounterOfferCount = 0,
            CreatedAt = DateTime.Now,
            UpdatedAt = DateTime.Now
        };

        await _appointmentRepository.AddAsync(appointment, ct);

        // Gửi thông báo cho invitee
        await _notificationService.CreateNotificationAsync(new NotificationDto_1
        {
            UserId = inviteePet.UserId,
            Title = "Lời mời gặp gỡ mới! 🐾",
            Message = $"Bé {inviterPet.Name} muốn hẹn gặp bé {inviteePet.Name} vào {request.AppointmentDateTime:dd/MM/yyyy HH:mm}",
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

        if (request.Accept)
        {
            appointment.Status = "confirmed";
            appointment.CurrentDecisionUserId = null;

            // Thông báo cho inviter
            await _notificationService.CreateNotificationAsync(new NotificationDto_1
            {
                UserId = appointment.InviterUserId,
                Title = "Cuộc hẹn được xác nhận! 🎉",
                Message = $"Bé {appointment.InviteePet?.Name} đã đồng ý gặp gỡ vào {appointment.AppointmentDateTime:dd/MM/yyyy HH:mm}",
                Type = "appointment_accepted"
            }, ct);
        }
        else
        {
            appointment.Status = "rejected";
            appointment.CancelReason = request.DeclineReason;
            appointment.CancelledBy = userId;

            // Thông báo cho inviter
            await _notificationService.CreateNotificationAsync(new NotificationDto_1
            {
                UserId = appointment.InviterUserId,
                Title = "Cuộc hẹn bị từ chối 😢",
                Message = $"Bé {appointment.InviteePet?.Name} không thể tham gia cuộc hẹn. Lý do: {request.DeclineReason ?? "Không có"}",
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

        // Cập nhật thông tin
        if (request.NewDateTime.HasValue)
        {
            var minDateTime = DateTime.Now.AddHours(MIN_HOURS_ADVANCE);
            if (request.NewDateTime.Value < minDateTime)
                throw new ArgumentException($"Thời gian hẹn phải cách hiện tại ít nhất {MIN_HOURS_ADVANCE} tiếng");
            
            appointment.AppointmentDateTime = request.NewDateTime.Value;
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
        var now = DateTime.Now;
        if (userId == appointment.InviterUserId)
        {
            appointment.InviterCheckedIn = true;
            appointment.InviterCheckInTime = now;
        }
        else if (userId == appointment.InviteeUserId)
        {
            appointment.InviteeCheckedIn = true;
            appointment.InviteeCheckInTime = now;
        }
        else
        {
            throw new UnauthorizedAccessException("Bạn không phải thành viên của cuộc hẹn này");
        }

        // Nếu cả 2 đã check-in -> chuyển sang on_going hoặc completed
        if (appointment.InviterCheckedIn == true && appointment.InviteeCheckedIn == true)
        {
            appointment.Status = "on_going";

            // Thông báo cho cả 2
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

        appointment.UpdatedAt = now;
        await _appointmentRepository.UpdateAsync(appointment, ct);

        return MapToResponse(appointment);
    }

    #endregion

    #region Location

    public async Task<IEnumerable<LocationResponse>> GetSuggestedLocationsAsync(
        decimal? latitude,
        decimal? longitude,
        string? city,
        CancellationToken ct = default)
    {
        IEnumerable<PetAppointmentLocation> locations;

        if (latitude.HasValue && longitude.HasValue)
        {
            locations = await _locationRepository.GetNearbyLocationsAsync(
                latitude.Value, longitude.Value, 10, ct);
        }
        else if (!string.IsNullOrEmpty(city))
        {
            locations = await _locationRepository.GetByCityAsync(city, ct);
        }
        else
        {
            locations = await _locationRepository.GetAllAsync(ct);
            locations = locations.Where(l => l.IsPetFriendly == true).Take(20);
        }

        return locations.Select(MapLocationToResponse);
    }

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
