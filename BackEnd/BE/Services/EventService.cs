using BE.DTO;
using BE.Models;
using BE.Repositories.Interfaces;
using BE.Services.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace BE.Services;

public class EventService : IEventService
{
    private readonly IEventRepository _eventRepository;
    private readonly ISubmissionRepository _submissionRepository;
    private readonly INotificationService _notificationService;
    private readonly PawnderDatabaseContext _context;

    public EventService(
        IEventRepository eventRepository,
        ISubmissionRepository submissionRepository,
        INotificationService notificationService,
        PawnderDatabaseContext context)
    {
        _eventRepository = eventRepository;
        _submissionRepository = submissionRepository;
        _notificationService = notificationService;
        _context = context;
    }

    #region Admin Operations

    public async Task<IEnumerable<EventResponse>> GetAllEventsAsync(CancellationToken ct = default)
    {
        var events = await _eventRepository.GetAllEventsAsync(ct);
        return events.Select(MapToResponse);
    }

    public async Task<EventResponse> CreateEventAsync(int adminId, CreateEventRequest request, CancellationToken ct = default)
    {
        // Validation
        if (request.StartTime >= request.SubmissionDeadline)
            throw new ArgumentException("Thời gian bắt đầu phải trước thời gian đóng nhận bài");
        
        if (request.SubmissionDeadline >= request.EndTime)
            throw new ArgumentException("Thời gian đóng nhận bài phải trước thời gian kết thúc");

        if (request.StartTime < DateTime.Now)
            throw new ArgumentException("Thời gian bắt đầu phải trong tương lai");

        var petEvent = new PetEvent
        {
            Title = request.Title,
            Description = request.Description,
            CoverImageUrl = request.CoverImageUrl,
            StartTime = request.StartTime,
            SubmissionDeadline = request.SubmissionDeadline,
            EndTime = request.EndTime,
            Status = request.StartTime <= DateTime.Now ? "active" : "upcoming",
            PrizeDescription = request.PrizeDescription,
            PrizePoints = request.PrizePoints ?? 0,
            CreatedBy = adminId,
            CreatedAt = DateTime.Now,
            UpdatedAt = DateTime.Now
        };

        await _eventRepository.AddAsync(petEvent, ct);

        // Gửi notification cho tất cả users về sự kiện mới
        var allUserIds = await _context.Users
            .Where(u => u.IsDeleted != true && u.RoleId == 3)
            .Select(u => u.UserId)
            .ToListAsync(ct);

        var eventTitle = petEvent.Title;

        // Gửi tuần tự để tránh DbContext concurrency issue
        foreach (var userId in allUserIds)
        {
            try
            {
                await _notificationService.CreateNotificationAsync(new NotificationDto_1
                {
                    UserId = userId,
                    Title = "🎉 Sự kiện mới!",
                    Message = $"Sự kiện '{eventTitle}' vừa được tạo. Tham gia ngay!",
                    Type = "event_created"
                });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[EventService] Failed to send notification to user {userId}: {ex.Message}");
            }
        }

        return MapToResponse(petEvent);
    }

    // Helper method để gửi notification an toàn (không throw exception)
    private async Task SafeSendNotificationAsync(int userId, string title, string message, string type)
    {
        try
        {
            await _notificationService.CreateNotificationAsync(new NotificationDto_1
            {
                UserId = userId,
                Title = title,
                Message = message,
                Type = type
            });
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[EventService] Failed to send notification to user {userId}: {ex.Message}");
        }
    }

    public async Task<EventResponse> UpdateEventAsync(int eventId, UpdateEventRequest request, CancellationToken ct = default)
    {
        var petEvent = await _eventRepository.GetByIdAsync(eventId, ct)
            ?? throw new KeyNotFoundException("Không tìm thấy sự kiện");

        if (petEvent.Status == "completed" || petEvent.Status == "cancelled")
            throw new InvalidOperationException("Không thể cập nhật sự kiện đã hoàn thành hoặc đã hủy");

        if (request.Title != null) petEvent.Title = request.Title;
        if (request.Description != null) petEvent.Description = request.Description;
        if (request.CoverImageUrl != null) petEvent.CoverImageUrl = request.CoverImageUrl;
        if (request.StartTime.HasValue) petEvent.StartTime = request.StartTime.Value;
        if (request.SubmissionDeadline.HasValue) petEvent.SubmissionDeadline = request.SubmissionDeadline.Value;
        if (request.EndTime.HasValue) petEvent.EndTime = request.EndTime.Value;
        if (request.PrizeDescription != null) petEvent.PrizeDescription = request.PrizeDescription;
        if (request.PrizePoints.HasValue) petEvent.PrizePoints = request.PrizePoints.Value;

        petEvent.UpdatedAt = DateTime.Now;

        await _eventRepository.UpdateAsync(petEvent, ct);

        // Gửi notification cho tất cả users về cập nhật sự kiện
        var allUserIds = await _context.Users
            .Where(u => u.IsDeleted != true && u.RoleId == 3)
            .Select(u => u.UserId)
            .ToListAsync(ct);

        // Tạo message mô tả thay đổi
        var changes = new List<string>();
        if (request.Title != null) changes.Add("tiêu đề");
        if (request.StartTime.HasValue) changes.Add("thời gian bắt đầu");
        if (request.SubmissionDeadline.HasValue) changes.Add("hạn nộp bài");
        if (request.EndTime.HasValue) changes.Add("thời gian kết thúc");
        if (request.PrizeDescription != null) changes.Add("giải thưởng");
        
        var changeText = changes.Any() ? string.Join(", ", changes) : "thông tin";
        var eventTitle = petEvent.Title;

        // Gửi tuần tự để tránh DbContext concurrency issue
        foreach (var userId in allUserIds)
        {
            await SafeSendNotificationAsync(userId, 
                "📝 Sự kiện được cập nhật", 
                $"Sự kiện '{eventTitle}' đã cập nhật {changeText}. Xem chi tiết!",
                "event_updated");
        }

        return MapToResponse(petEvent);
    }

    public async Task CancelEventAsync(int eventId, string? reason, CancellationToken ct = default)
    {
        var petEvent = await _eventRepository.GetByIdAsync(eventId, ct)
            ?? throw new KeyNotFoundException("Không tìm thấy sự kiện");

        if (petEvent.Status == "completed")
            throw new InvalidOperationException("Không thể hủy sự kiện đã hoàn thành");

        petEvent.Status = "cancelled";
        petEvent.UpdatedAt = DateTime.Now;

        await _eventRepository.UpdateAsync(petEvent, ct);

        // Thông báo cho TẤT CẢ users về sự kiện bị hủy
        var allUserIds = await _context.Users
            .Where(u => u.IsDeleted != true && u.RoleId == 3)
            .Select(u => u.UserId)
            .ToListAsync(ct);

        var eventTitle = petEvent.Title;
        var cancelReason = reason;

        // Gửi tuần tự để tránh DbContext concurrency issue
        foreach (var userId in allUserIds)
        {
            await SafeSendNotificationAsync(userId, 
                "⚠️ Sự kiện đã bị hủy", 
                $"Sự kiện '{eventTitle}' đã bị hủy. {cancelReason ?? ""}".Trim(),
                "event_cancelled");
        }
    }

    #endregion

    #region User Operations

    public async Task<IEnumerable<EventResponse>> GetActiveEventsAsync(CancellationToken ct = default)
    {
        var events = await _eventRepository.GetActiveEventsAsync(ct);
        return events.Select(MapToResponse);
    }

    public async Task<EventDetailResponse?> GetEventByIdAsync(int eventId, int? currentUserId = null, CancellationToken ct = default)
    {
        var petEvent = await _eventRepository.GetEventWithSubmissionsAsync(eventId, ct);
        if (petEvent == null) return null;

        // Tính status động dựa trên thời gian thực
        var now = DateTime.Now;
        var actualStatus = petEvent.Status;
        
        // Nếu event bị cancelled hoặc completed thì giữ nguyên status
        if (petEvent.Status != "cancelled" && petEvent.Status != "completed")
        {
            if (now < petEvent.StartTime)
            {
                actualStatus = "upcoming";
            }
            else if (now >= petEvent.StartTime && now < petEvent.SubmissionDeadline)
            {
                actualStatus = "active";
            }
            else if (now >= petEvent.SubmissionDeadline && now < petEvent.EndTime)
            {
                actualStatus = "submission_closed";
            }
            else if (now >= petEvent.EndTime)
            {
                actualStatus = "voting_ended";
            }
        }

        var response = new EventDetailResponse
        {
            EventId = petEvent.EventId,
            Title = petEvent.Title,
            Description = petEvent.Description,
            CoverImageUrl = petEvent.CoverImageUrl,
            StartTime = petEvent.StartTime,
            SubmissionDeadline = petEvent.SubmissionDeadline,
            EndTime = petEvent.EndTime,
            Status = actualStatus,
            PrizeDescription = petEvent.PrizeDescription,
            PrizePoints = petEvent.PrizePoints ?? 0,
            SubmissionCount = petEvent.Submissions?.Count ?? 0,
            TotalVotes = petEvent.Submissions?.Sum(s => s.VoteCount ?? 0) ?? 0,
            CreatedAt = petEvent.CreatedAt ?? DateTime.Now,
            CreatedByName = petEvent.CreatedByUser?.FullName,
            Submissions = petEvent.Submissions?
                .OrderByDescending(s => s.VoteCount)
                .Select(s => MapSubmissionToResponse(s, currentUserId)),
            Winners = petEvent.Submissions?
                .Where(s => s.IsWinner == true)
                .OrderBy(s => s.Rank)
                .Select(s => MapSubmissionToResponse(s, currentUserId))
        };

        return response;
    }

    public async Task<SubmissionResponse> SubmitEntryAsync(int userId, SubmitEntryRequest request, CancellationToken ct = default)
    {
        var petEvent = await _eventRepository.GetByIdAsync(request.EventId, ct)
            ?? throw new KeyNotFoundException("Không tìm thấy sự kiện");

        // Validation - check thời gian thực thay vì status từ DB
        var now = DateTime.Now;
        
        // Sự kiện đã bị hủy hoặc hoàn thành
        if (petEvent.Status == "cancelled")
            throw new InvalidOperationException("Sự kiện đã bị hủy");
        
        if (petEvent.Status == "completed")
            throw new InvalidOperationException("Sự kiện đã kết thúc");

        // Check thời gian thực: phải sau StartTime và trước SubmissionDeadline
        if (now < petEvent.StartTime)
            throw new InvalidOperationException("Sự kiện chưa bắt đầu");

        if (now > petEvent.SubmissionDeadline)
            throw new InvalidOperationException("Đã quá thời gian nhận bài dự thi");

        if (await _submissionRepository.HasUserSubmittedAsync(request.EventId, userId, ct))
            throw new InvalidOperationException("Bạn đã đăng bài dự thi cho sự kiện này rồi");

        // Validate pet belongs to user
        var pet = await _context.Pets
            .FirstOrDefaultAsync(p => p.PetId == request.PetId && p.UserId == userId && p.IsDeleted != true, ct);
        
        if (pet == null)
            throw new ArgumentException("Thú cưng không hợp lệ hoặc không thuộc về bạn");

        // Validate media type (chỉ cho phép image/video)
        // Chấp nhận cả MIME type đầy đủ (image/jpeg) và dạng đơn giản (image, video)
        var allowedMimeTypes = new[] { "image/jpeg", "image/png", "image/jpg", "image/webp", "image/gif", "video/mp4", "video/quicktime" };
        var allowedSimpleTypes = new[] { "image", "video" };
        var mediaTypeLower = request.MediaType?.ToLower() ?? "";
        
        if (!string.IsNullOrEmpty(request.MediaType) && 
            !allowedMimeTypes.Contains(mediaTypeLower) && 
            !allowedSimpleTypes.Contains(mediaTypeLower))
            throw new ArgumentException("Định dạng file không hợp lệ. Chỉ chấp nhận ảnh (JPG, PNG, WebP, GIF) hoặc video (MP4)");

        // Validate media size (≤50MB) - nếu có MediaSize trong request
        const long MAX_MEDIA_SIZE = 50 * 1024 * 1024; // 50MB
        if (request.MediaSize.HasValue && request.MediaSize.Value > MAX_MEDIA_SIZE)
            throw new ArgumentException("File quá lớn. Kích thước tối đa là 50MB");

        // Validate caption length (≤500 chars)
        const int MAX_CAPTION_LENGTH = 500;
        if (!string.IsNullOrEmpty(request.Caption) && request.Caption.Length > MAX_CAPTION_LENGTH)
            throw new ArgumentException($"Mô tả quá dài. Tối đa {MAX_CAPTION_LENGTH} ký tự");

        var submission = new EventSubmission
        {
            EventId = request.EventId,
            UserId = userId,
            PetId = request.PetId,
            MediaUrl = request.MediaUrl,
            MediaType = request.MediaType,
            ThumbnailUrl = request.ThumbnailUrl,
            Caption = request.Caption,
            VoteCount = 0,
            CreatedAt = DateTime.Now
        };

        await _submissionRepository.AddAsync(submission, ct);

        // Reload with details
        var result = await _submissionRepository.GetByIdWithDetailsAsync(submission.SubmissionId, ct);
        return MapSubmissionToResponse(result!, userId);
    }

    public async Task VoteAsync(int userId, int submissionId, CancellationToken ct = default)
    {
        var submission = await _submissionRepository.GetByIdWithDetailsAsync(submissionId, ct)
            ?? throw new KeyNotFoundException("Không tìm thấy bài dự thi");

        // Validation - check thời gian thực thay vì status từ DB
        var now = DateTime.Now;
        var petEvent = submission.Event;
        
        // Sự kiện đã bị hủy hoặc hoàn thành
        if (petEvent.Status == "cancelled")
            throw new InvalidOperationException("Sự kiện đã bị hủy");
        
        if (petEvent.Status == "completed")
            throw new InvalidOperationException("Sự kiện đã kết thúc, không thể vote");

        // Check thời gian thực: phải sau StartTime và trước EndTime
        if (now < petEvent.StartTime)
            throw new InvalidOperationException("Sự kiện chưa bắt đầu");

        if (now > petEvent.EndTime)
            throw new InvalidOperationException("Sự kiện đã kết thúc, không thể vote");

        if (submission.UserId == userId)
            throw new InvalidOperationException("Bạn không thể vote cho bài dự thi của chính mình");

        if (await _submissionRepository.HasUserVotedAsync(submissionId, userId, ct))
            throw new InvalidOperationException("Bạn đã vote cho bài này rồi");

        // Lưu vote count trước khi vote
        var previousVoteCount = submission.VoteCount ?? 0;

        await _submissionRepository.AddVoteAsync(submissionId, userId, ct);

        // Chỉ gửi notification khi:
        // 1. Đây là vote đầu tiên (0 -> 1)
        // 2. Hoặc đạt milestone (5, 10, 20, 50, 100...)
        var newVoteCount = previousVoteCount + 1;
        var shouldNotify = newVoteCount == 1 || 
                          newVoteCount == 5 || 
                          newVoteCount == 10 || 
                          newVoteCount == 20 || 
                          newVoteCount == 50 || 
                          newVoteCount == 100 ||
                          (newVoteCount > 100 && newVoteCount % 50 == 0);

        if (shouldNotify)
        {
            var message = newVoteCount == 1 
                ? $"Bài dự thi của bé {submission.Pet?.Name} vừa nhận được vote đầu tiên!"
                : $"Bài dự thi của bé {submission.Pet?.Name} đã đạt {newVoteCount} votes! 🎉";

            await _notificationService.CreateNotificationAsync(new NotificationDto_1
            {
                UserId = submission.UserId,
                Title = "❤️ Bài dự thi được yêu thích!",
                Message = message,
                Type = "event_vote"
            }, ct);
        }
    }

    public async Task UnvoteAsync(int userId, int submissionId, CancellationToken ct = default)
    {
        var submission = await _submissionRepository.GetByIdWithDetailsAsync(submissionId, ct)
            ?? throw new KeyNotFoundException("Không tìm thấy bài dự thi");

        // Validation - check thời gian thực
        var now = DateTime.Now;
        var petEvent = submission.Event;
        
        if (petEvent.Status == "completed" || now > petEvent.EndTime)
            throw new InvalidOperationException("Không thể bỏ vote khi sự kiện đã kết thúc");

        if (!await _submissionRepository.HasUserVotedAsync(submissionId, userId, ct))
            throw new InvalidOperationException("Bạn chưa vote cho bài này");

        await _submissionRepository.RemoveVoteAsync(submissionId, userId, ct);
    }

    public async Task<IEnumerable<LeaderboardResponse>> GetLeaderboardAsync(int eventId, int? currentUserId = null, CancellationToken ct = default)
    {
        var submissions = await _submissionRepository.GetLeaderboardAsync(eventId, 10, ct);
        
        int rank = 1;
        return submissions.Select(s => new LeaderboardResponse
        {
            Rank = rank++,
            Submission = MapSubmissionToResponse(s, currentUserId)
        });
    }

    #endregion

    #region Background Job

    public async Task ProcessEventTransitionsAsync(CancellationToken ct = default)
    {
        var eventsToTransition = await _eventRepository.GetEventsToTransitionAsync(ct);
        var now = DateTime.Now;

        foreach (var petEvent in eventsToTransition)
        {
            var oldStatus = petEvent.Status;

            if (petEvent.Status == "upcoming" && petEvent.StartTime <= now)
            {
                petEvent.Status = "active";
            }
            else if (petEvent.Status == "active" && petEvent.SubmissionDeadline <= now)
            {
                petEvent.Status = "submission_closed";
            }
            else if (petEvent.Status == "submission_closed" && petEvent.EndTime <= now)
            {
                petEvent.Status = "voting_ended";
                // Tính kết quả
                await ProcessEventResultsAsync(petEvent.EventId, ct);
            }

            petEvent.UpdatedAt = now;
            await _eventRepository.UpdateAsync(petEvent, ct);

            Console.WriteLine($"[EventService] Event {petEvent.EventId} transitioned from {oldStatus} to {petEvent.Status}");
        }
    }

    public async Task ProcessEventResultsAsync(int eventId, CancellationToken ct = default)
    {
        var petEvent = await _eventRepository.GetEventWithSubmissionsAsync(eventId, ct);
        if (petEvent == null) return;

        // Lấy Top 3
        var topSubmissions = petEvent.Submissions?
            .Where(s => s.IsDeleted != true)
            .OrderByDescending(s => s.VoteCount)
            .ThenBy(s => s.CreatedAt)
            .Take(3)
            .ToList();

        // Nếu có bài dự thi, tính kết quả và thông báo winners
        if (topSubmissions != null && topSubmissions.Any())
        {
            int rank = 1;
            foreach (var submission in topSubmissions)
            {
                submission.Rank = rank;
                submission.IsWinner = true;

                // Cộng điểm cho winner (nếu có)
                if (petEvent.PrizePoints > 0 && rank == 1)
                {
                    // Có thể thêm logic cộng điểm uy tín cho user ở đây
                }

                // Thông báo cho winner
                await _notificationService.CreateNotificationAsync(new NotificationDto_1
                {
                    UserId = submission.UserId,
                    Title = rank == 1 ? "🏆 Chúc mừng! Bạn đạt Quán quân!" : $"🎉 Chúc mừng! Bạn đạt Top {rank}!",
                    Message = $"Bé {submission.Pet?.Name} đã giành vị trí Top {rank} trong '{petEvent.Title}'!",
                    Type = "event_winner"
                }, ct);

                rank++;
            }
        }

        // Luôn chuyển sang completed, dù có hay không có bài dự thi
        petEvent.Status = "completed";
        petEvent.UpdatedAt = DateTime.Now;

        await _context.SaveChangesAsync(ct);
    }

    #endregion

    #region Private Helpers

    private static EventResponse MapToResponse(PetEvent e)
    {
        // Tính status động dựa trên thời gian thực
        var now = DateTime.Now;
        var actualStatus = e.Status;
        
        // Nếu event bị cancelled hoặc completed thì giữ nguyên status
        if (e.Status != "cancelled" && e.Status != "completed")
        {
            if (now < e.StartTime)
            {
                actualStatus = "upcoming";
            }
            else if (now >= e.StartTime && now < e.SubmissionDeadline)
            {
                actualStatus = "active";
            }
            else if (now >= e.SubmissionDeadline && now < e.EndTime)
            {
                actualStatus = "submission_closed";
            }
            else if (now >= e.EndTime)
            {
                actualStatus = "voting_ended";
            }
        }
        
        return new EventResponse
        {
            EventId = e.EventId,
            Title = e.Title,
            Description = e.Description,
            CoverImageUrl = e.CoverImageUrl,
            StartTime = e.StartTime,
            SubmissionDeadline = e.SubmissionDeadline,
            EndTime = e.EndTime,
            Status = actualStatus,
            PrizeDescription = e.PrizeDescription,
            PrizePoints = e.PrizePoints ?? 0,
            SubmissionCount = e.Submissions?.Count ?? 0,
            TotalVotes = e.Submissions?.Sum(s => s.VoteCount ?? 0) ?? 0,
            CreatedAt = e.CreatedAt ?? DateTime.Now
        };
    }

    private static SubmissionResponse MapSubmissionToResponse(EventSubmission s, int? currentUserId)
    {
        // Lấy ảnh primary, nếu không có thì lấy ảnh đầu tiên
        var petPhoto = s.Pet?.PetPhotos?.FirstOrDefault(p => p.IsPrimary == true) 
                    ?? s.Pet?.PetPhotos?.FirstOrDefault();
        
        return new SubmissionResponse
        {
            SubmissionId = s.SubmissionId,
            EventId = s.EventId,
            UserId = s.UserId,
            UserName = s.User?.FullName,
            UserAvatar = null, // User không có avatar trong model hiện tại
            PetId = s.PetId,
            PetName = s.Pet?.Name,
            PetPhotoUrl = petPhoto?.ImageUrl,
            MediaUrl = s.MediaUrl,
            MediaType = s.MediaType,
            ThumbnailUrl = s.ThumbnailUrl,
            Caption = s.Caption,
            VoteCount = s.VoteCount ?? 0,
            Rank = s.Rank,
            IsWinner = s.IsWinner ?? false,
            HasVoted = currentUserId.HasValue && s.Votes?.Any(v => v.UserId == currentUserId.Value) == true,
            IsOwner = currentUserId.HasValue && s.UserId == currentUserId.Value,
            CreatedAt = s.CreatedAt ?? DateTime.Now
        };
    }

    #endregion
}
