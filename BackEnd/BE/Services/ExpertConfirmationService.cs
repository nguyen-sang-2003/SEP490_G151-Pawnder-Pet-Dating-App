using BE.DTO;
using BE.Models;
using BE.Repositories.Interfaces;
using BE.Services.Interfaces;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;

namespace BE.Services
{
    public class ExpertConfirmationService : IExpertConfirmationService
    {
        private readonly IExpertConfirmationRepository _expertConfirmationRepository;
        private readonly PawnderDatabaseContext _context;
        private readonly DailyLimitService _dailyLimitService;
        private readonly INotificationService _notificationService;
        private readonly IHubContext<ChatHub> _hubContext;

        public ExpertConfirmationService(
            IExpertConfirmationRepository expertConfirmationRepository,
            PawnderDatabaseContext context,
            DailyLimitService dailyLimitService,
            INotificationService notificationService,
            IHubContext<ChatHub> hubContext)
        {
            _expertConfirmationRepository = expertConfirmationRepository;
            _context = context;
            _dailyLimitService = dailyLimitService;
            _notificationService = notificationService;
            _hubContext = hubContext;
        }

        public async Task<IEnumerable<ExpertConfirmationDTO>> GetAllExpertConfirmationsAsync(CancellationToken ct = default)
        {
            return await _expertConfirmationRepository.GetAllExpertConfirmationsAsync(ct);
        }

        public async Task<ExpertConfirmationDTO?> GetExpertConfirmationAsync(int expertId, int userId, int chatId, CancellationToken ct = default)
        {
            var confirmation = await _expertConfirmationRepository.GetExpertConfirmationAsync(expertId, userId, chatId, ct);
            if (confirmation == null)
                return null;

            return new ExpertConfirmationDTO
            {
                UserId = confirmation.UserId,
                ChatAiId = confirmation.ChatAiid,
                ExpertId = confirmation.ExpertId,
                Status = confirmation.Status,
                Message = confirmation.Message,
                UserQuestion = confirmation.UserQuestion,
                CreatedAt = confirmation.CreatedAt,
                UpdatedAt = confirmation.UpdatedAt
            };
        }

        public async Task<IEnumerable<ExpertConfirmationDTO>> GetUserExpertConfirmationsAsync(int userId, CancellationToken ct = default)
        {
            // Business logic: Validate user exists
            var user = await _context.Users.FindAsync([userId], ct);
            if (user == null)
                throw new KeyNotFoundException("Người dùng không tồn tại.");

            return await _expertConfirmationRepository.GetUserExpertConfirmationsAsync(userId, ct);
        }

        public async Task<ExpertConfirmationResponseDTO> CreateExpertConfirmationAsync(int userId, int chatId, ExpertConfirmationCreateDTO dto, CancellationToken ct = default)
        {
            // Business logic: Check daily limit
            bool canConfirm = await _dailyLimitService.CanPerformAction(userId, "expert_confirm");
            if (!canConfirm)
            {
                int remaining = await _dailyLimitService.GetRemainingCount(userId, "expert_confirm");
                throw new InvalidOperationException($"Bạn đã hết lượt yêu cầu chuyên gia xác nhận hôm nay!");
            }

            // Business logic: Validate user
            var user = await _context.Users.FindAsync([userId], ct);
            if (user == null)
                throw new KeyNotFoundException("Người dùng không tồn tại.");

            // Business logic: Validate chat
            var chat = await _context.ChatAis.FindAsync([chatId], ct);
            if (chat == null)
                throw new KeyNotFoundException("Chat AI không tồn tại.");

            // Business logic: Auto-assign expert if not provided
            int expertId;
            if (dto.ExpertId.HasValue && dto.ExpertId.Value > 0)
            {
                // Validate provided expert
                var providedExpert = await _context.Users.FindAsync([dto.ExpertId.Value], ct);
                if (providedExpert == null || providedExpert.RoleId != 2) // RoleId 2 = Expert
                    throw new KeyNotFoundException("Chuyên gia không tồn tại.");
                expertId = dto.ExpertId.Value;
            }
            else
            {
                // Auto-assign: Get random available expert
                var availableExperts = await _context.Users
                    .Where(u => u.RoleId == 2 && u.IsDeleted == false)
                    .Select(u => u.UserId)
                    .ToListAsync(ct);
                
                if (!availableExperts.Any())
                    throw new InvalidOperationException("Hiện tại không có chuyên gia nào khả dụng.");
                
                // Random selection
                var random = new Random();
                expertId = availableExperts[random.Next(availableExperts.Count)];
            }

            // Business logic: Check duplicate
            var existingConfirmation = await _expertConfirmationRepository.GetExpertConfirmationByUserAndChatAsync(userId, chatId, ct);
            if (existingConfirmation != null)
                throw new InvalidOperationException("Yêu cầu xác nhận đã tồn tại.");

            var now = DateTime.SpecifyKind(DateTime.UtcNow, DateTimeKind.Unspecified);
            var expertConfirmation = new ExpertConfirmation
            {
                UserId = userId,
                ExpertId = expertId,  // Auto-assigned or provided expert
                ChatAiid = chatId,
                Status = "pending",
                Message = dto.Message,  // NULL initially - will be filled when expert responds
                UserQuestion = dto.UserQuestion,  // User's original question
                CreatedAt = now,
                UpdatedAt = now
            };

            await _expertConfirmationRepository.AddAsync(expertConfirmation, ct);

            // Business logic: Record action to daily limit
            await _dailyLimitService.RecordAction(userId, "expert_confirm");
            int remainingConfirms = await _dailyLimitService.GetRemainingCount(userId, "expert_confirm");

            return new ExpertConfirmationResponseDTO
            {
                UserId = expertConfirmation.UserId,
                ChatAiId = expertConfirmation.ChatAiid,
                ExpertId = expertConfirmation.ExpertId,
                Status = expertConfirmation.Status,
                Message = expertConfirmation.Message,
                UserQuestion = expertConfirmation.UserQuestion,
                ResultMessage = "Yêu cầu chuyên gia xác nhận đã được tạo thành công.",
                CreatedAt = expertConfirmation.CreatedAt,
                UpdatedAt = expertConfirmation.UpdatedAt
            };
        }

        public async Task<ExpertConfirmationResponseDTO> UpdateExpertConfirmationAsync(int expertId, int userId, int chatId, ExpertConfirmationUpdateDto dto, CancellationToken ct = default)
        {
            var expertConfirmation = await _expertConfirmationRepository.GetExpertConfirmationAsync(expertId, userId, chatId, ct);
            if (expertConfirmation == null)
                throw new KeyNotFoundException("Yêu cầu xác nhận không tồn tại.");

            // Track if status is being changed to "confirmed"
            bool isConfirming = !string.IsNullOrEmpty(dto.Status) && 
                                dto.Status.ToLower() == "confirmed" && 
                                expertConfirmation.Status?.ToLower() != "confirmed";

            // Business logic: Update status and message
            if (!string.IsNullOrEmpty(dto.Status))
                expertConfirmation.Status = dto.Status;

            if (!string.IsNullOrEmpty(dto.Message))
                expertConfirmation.Message = dto.Message;

            expertConfirmation.UpdatedAt = DateTime.SpecifyKind(DateTime.UtcNow, DateTimeKind.Unspecified);

            await _expertConfirmationRepository.UpdateAsync(expertConfirmation, ct);

            // Business logic: Create notification for user when expert confirms
            Console.WriteLine($"[ExpertConfirmation] isConfirming={isConfirming}, dto.Status={dto.Status}, expertConfirmation.Status={expertConfirmation.Status}, dto.Message={dto.Message}");
            
            if (isConfirming && !string.IsNullOrEmpty(dto.Message))
            {
                try
                {
                    Console.WriteLine($"[ExpertConfirmation] Creating notification for UserId={expertConfirmation.UserId}");
                    
                    // Get expert name for notification
                    var expert = await _context.Users.FindAsync([expertConfirmation.ExpertId], ct);
                    var expertName = expert?.FullName ?? "Chuyên gia";
                    
                    Console.WriteLine($"[ExpertConfirmation] Expert found: {expertName} (ID={expertConfirmation.ExpertId})");

                    // Create notification for user
                    var notificationDto = new NotificationDto_1
                    {
                        UserId = expertConfirmation.UserId,
                        Title = $"Chuyên gia {expertName} đã xác nhận thông tin",
                        Message = dto.Message
                    };
                    
                    Console.WriteLine($"[ExpertConfirmation] Calling NotificationService.CreateNotificationAsync with UserId={notificationDto.UserId}, Title={notificationDto.Title}");
                    
                    var createdNotification = await _notificationService.CreateNotificationAsync(notificationDto, ct);
                    
                    Console.WriteLine($"✅ [ExpertConfirmation] Notification created successfully! NotificationId={createdNotification?.NotificationId}");

                    // Send real-time notification via SignalR with metadata (expertId, chatId)
                    try
                    {
                        Console.WriteLine($"[ExpertConfirmation] Sending real-time notification to UserId={expertConfirmation.UserId} with ExpertId={expertConfirmation.ExpertId}, ChatAiId={expertConfirmation.ChatAiid}");
                        await ChatHub.SendNotificationWithMetadata(
                            _hubContext, 
                            expertConfirmation.UserId, 
                            notificationDto.Title, 
                            notificationDto.Message, 
                            "expert_confirmation",
                            expertId: expertConfirmation.ExpertId,
                            chatId: expertConfirmation.ChatAiid
                        );
                        Console.WriteLine($"✅ [ExpertConfirmation] Real-time notification sent successfully!");
                    }
                    catch (Exception signalREx)
                    {
                        // Don't fail if SignalR fails (user might be offline)
                        Console.WriteLine($"⚠️ [ExpertConfirmation] SignalR notification failed (user might be offline): {signalREx.Message}");
                    }
                }
                catch (Exception ex)
                {
                    // Log detailed error for debugging
                    Console.WriteLine($"❌ [ExpertConfirmation] ERROR creating notification: {ex.Message}");
                    Console.WriteLine($"❌ [ExpertConfirmation] Exception type: {ex.GetType().Name}");
                    Console.WriteLine($"❌ [ExpertConfirmation] Stack trace: {ex.StackTrace}");
                    if (ex.InnerException != null)
                    {
                        Console.WriteLine($"❌ [ExpertConfirmation] Inner exception: {ex.InnerException.Message}");
                    }
                    
                    // Don't fail the confirmation update, but log the error clearly
                }
            }
            else
            {
                if (!isConfirming)
                {
                    Console.WriteLine($"⚠️ [ExpertConfirmation] Skipping notification: not confirming (dto.Status={dto.Status}, current status={expertConfirmation.Status})");
                }
                else if (string.IsNullOrEmpty(dto.Message))
                {
                    Console.WriteLine($"⚠️ [ExpertConfirmation] Skipping notification: message is empty");
                }
            }

            return new ExpertConfirmationResponseDTO
            {
                UserId = expertConfirmation.UserId,
                ChatAiId = expertConfirmation.ChatAiid,
                ExpertId = expertConfirmation.ExpertId,
                Status = expertConfirmation.Status,
                Message = expertConfirmation.Message,
                UserQuestion = expertConfirmation.UserQuestion,
                ResultMessage = "Cập nhật yêu cầu confirm thành công",
                CreatedAt = expertConfirmation.CreatedAt,
                UpdatedAt = expertConfirmation.UpdatedAt
            };
        }

        public async Task<IEnumerable<object>> GetUserExpertChatsAsync(int userId, CancellationToken ct = default)
        {
            // Get all ChatExpert for this user
            var expertChats = await _context.ChatExperts
                .Where(ce => ce.UserId == userId)
                .Include(ce => ce.Expert)
                .OrderByDescending(ce => ce.UpdatedAt)
                .ToListAsync(ct);

            var result = new List<object>();

            foreach (var chat in expertChats)
            {
                // Get last message
                var lastMessage = await _context.ChatExpertContents
                    .Where(cec => cec.ChatExpertId == chat.ChatExpertId)
                    .OrderByDescending(cec => cec.CreatedAt)
                    .FirstOrDefaultAsync(ct);

                // Count unread messages (messages from expert that user hasn't seen)
                // For now, we'll set unread to 0 - can be enhanced later
                var unreadCount = 0;

                result.Add(new
                {
                    id = chat.ChatExpertId.ToString(),
                    chatExpertId = chat.ChatExpertId,
                    expertId = chat.ExpertId,
                    expertName = chat.Expert?.FullName ?? "Chuyên gia",
                    specialty = "Chuyên gia thú y",
                    lastMessage = lastMessage?.Message ?? "Chưa có tin nhắn",
                    time = lastMessage?.CreatedAt ?? chat.CreatedAt,
                    unread = unreadCount,
                    isOnline = false // Can be enhanced with SignalR
                });
            }

            return result;
        }
    }
}




