using BE.DTO;
using BE.Models;
using BE.Repositories.Interfaces;
using BE.Services.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace BE.Services
{
    public class ExpertConfirmationService : IExpertConfirmationService
    {
        private readonly IExpertConfirmationRepository _expertConfirmationRepository;
        private readonly PawnderDatabaseContext _context;
        private readonly DailyLimitService _dailyLimitService;

        public ExpertConfirmationService(
            IExpertConfirmationRepository expertConfirmationRepository,
            PawnderDatabaseContext context,
            DailyLimitService dailyLimitService)
        {
            _expertConfirmationRepository = expertConfirmationRepository;
            _context = context;
            _dailyLimitService = dailyLimitService;
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
                throw new InvalidOperationException($"Bạn đã hết lượt yêu cầu chuyên gia xác nhận hôm nay! Nâng cấp lên VIP để sử dụng không giới hạn. Còn lại: {remaining}");
            }

            // Business logic: Validate user
            var user = await _context.Users.FindAsync([userId], ct);
            if (user == null)
                throw new KeyNotFoundException("Người dùng không tồn tại.");

            // Business logic: Validate chat
            var chat = await _context.ChatAis.FindAsync([chatId], ct);
            if (chat == null)
                throw new KeyNotFoundException("Chat AI không tồn tại.");

            // Business logic: Validate expert
            var expert = await _context.Users.FindAsync([dto.ExpertId], ct);
            if (expert == null)
                throw new KeyNotFoundException("Chuyên gia không tồn tại.");

            // Business logic: Check duplicate
            var existingConfirmation = await _expertConfirmationRepository.GetExpertConfirmationByUserAndChatAsync(userId, chatId, ct);
            if (existingConfirmation != null)
                throw new InvalidOperationException("Yêu cầu xác nhận đã tồn tại.");

            var now = DateTime.SpecifyKind(DateTime.UtcNow, DateTimeKind.Unspecified);
            var expertConfirmation = new ExpertConfirmation
            {
                UserId = userId,
                ExpertId = expert.UserId,
                ChatAiid = chatId,
                Status = "pending",
                Message = dto.Message,
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

        public async Task<ExpertConfirmationResponseDTO> UpdateExpertConfirmationAsync(int confirmationId, int userId, int chatId, ExpertConfirmationUpdateDto dto, CancellationToken ct = default)
        {
            var expertConfirmation = await _expertConfirmationRepository.GetExpertConfirmationAsync(confirmationId, userId, chatId, ct);
            if (expertConfirmation == null)
                throw new KeyNotFoundException("Yêu cầu xác nhận không tồn tại.");

            // Business logic: Update status and message
            if (!string.IsNullOrEmpty(dto.Status))
                expertConfirmation.Status = dto.Status;

            if (!string.IsNullOrEmpty(dto.Message))
                expertConfirmation.Message = dto.Message;

            expertConfirmation.UpdatedAt = DateTime.SpecifyKind(DateTime.UtcNow, DateTimeKind.Unspecified);

            await _expertConfirmationRepository.UpdateAsync(expertConfirmation, ct);

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
    }
}




