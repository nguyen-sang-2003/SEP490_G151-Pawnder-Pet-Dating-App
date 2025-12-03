using BE.Models;
using BE.Repositories.Interfaces;
using BE.Services.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace BE.Services
{
    public class ChatExpertService : IChatExpertService
    {
        private readonly IChatExpertRepository _chatExpertRepository;
        private readonly PawnderDatabaseContext _context;

        public ChatExpertService(
            IChatExpertRepository chatExpertRepository,
            PawnderDatabaseContext context)
        {
            _chatExpertRepository = chatExpertRepository;
            _context = context;
        }

        public async Task<IEnumerable<object>> GetChatsByUserIdAsync(int userId, CancellationToken ct = default)
        {
            // Validate user exists
            var userExists = await _context.Users.AnyAsync(u => u.UserId == userId, ct);
            if (!userExists)
                throw new KeyNotFoundException("Không tìm thấy người dùng.");

            return await _chatExpertRepository.GetChatsByUserIdAsync(userId, ct);
        }

        /// <summary>
        /// Lấy danh sách chat của expert.
        /// Lưu ý: Chỉ trả về các chat đã tồn tại trong database.
        /// Chat chỉ được tạo khi user chọn chat với expert (qua CreateChatAsync).
        /// Khi expert mới đăng nhập, nếu chưa có user nào chọn chat thì sẽ trả về danh sách rỗng.
        /// </summary>
        public async Task<IEnumerable<object>> GetChatsByExpertIdAsync(int expertId, CancellationToken ct = default)
        {
            Console.WriteLine($"🔍 [ChatExpertService] Getting chats for expertId: {expertId}");
            
            // Validate expert exists
            var expertExists = await _context.Users.AnyAsync(u => u.UserId == expertId, ct);
            Console.WriteLine($"👤 [ChatExpertService] Expert exists: {expertExists}");
            
            if (!expertExists)
                throw new KeyNotFoundException("Không tìm thấy chuyên gia.");

            // Chỉ trả về các chat đã tồn tại - không tự động tạo chat mới
            var chats = await _chatExpertRepository.GetChatsByExpertIdAsync(expertId, ct);
            var chatsList = chats.ToList();
            Console.WriteLine($"💬 [ChatExpertService] Found {chatsList.Count} chats for expert {expertId}");
            
            return chatsList;
        }

        /// <summary>
        /// Tạo chat mới giữa expert và user.
        /// Method này chỉ được gọi khi user chọn chat với expert (không tự động tạo khi expert đăng nhập).
        /// Nếu chat đã tồn tại thì trả về chat hiện có.
        /// </summary>
        public async Task<object> CreateChatAsync(int expertId, int userId, CancellationToken ct = default)
        {
            if (expertId == userId)
                throw new InvalidOperationException("Không thể tạo chat với chính mình.");

            // Validate expert and user exist
            var expert = await _context.Users.FirstOrDefaultAsync(u => u.UserId == expertId, ct);
            if (expert == null)
                throw new KeyNotFoundException("Không tìm thấy chuyên gia.");

            var user = await _context.Users.FirstOrDefaultAsync(u => u.UserId == userId, ct);
            if (user == null)
                throw new KeyNotFoundException("Không tìm thấy người dùng.");

            // Check if chat already exists - nếu đã có thì trả về chat hiện có
            var existingChat = await _chatExpertRepository.GetChatExpertByExpertAndUserAsync(expertId, userId, ct);
            if (existingChat != null)
            {
                Console.WriteLine($"✅ [ChatExpertService] Chat already exists: ChatExpertId={existingChat.ChatExpertId}, ExpertId={expertId}, UserId={userId}");
                return new
                {
                    existingChat.ChatExpertId,
                    existingChat.ExpertId,
                    existingChat.UserId,
                    existingChat.CreatedAt
                };
            }

            // Tạo chat mới - chỉ khi user chọn chat với expert
            Console.WriteLine($"🆕 [ChatExpertService] Creating new chat: ExpertId={expertId}, UserId={userId}");
            var chatExpert = new ChatExpert
            {
                ExpertId = expertId,
                UserId = userId,
                CreatedAt = DateTime.SpecifyKind(DateTime.UtcNow, DateTimeKind.Unspecified),
                UpdatedAt = DateTime.SpecifyKind(DateTime.UtcNow, DateTimeKind.Unspecified)
            };

            await _chatExpertRepository.AddAsync(chatExpert, ct);
            Console.WriteLine($"✅ [ChatExpertService] Chat created successfully: ChatExpertId={chatExpert.ChatExpertId}");

            return new
            {
                chatExpert.ChatExpertId,
                chatExpert.ExpertId,
                chatExpert.UserId,
                chatExpert.CreatedAt
            };
        }
    }
}

