using BE.Models;
using BE.Repositories.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace BE.Repositories
{
    public class ChatExpertRepository : BaseRepository<ChatExpert>, IChatExpertRepository
    {
        public ChatExpertRepository(PawnderDatabaseContext context) : base(context)
        {
        }

        public async Task<IEnumerable<object>> GetChatsByUserIdAsync(int userId, CancellationToken ct = default)
        {
            var chats = await _dbSet
                .Include(c => c.Expert)
                .Include(c => c.User)
                .Include(c => c.ChatExpertContents)
                .Where(c => c.UserId == userId)
                .ToListAsync(ct);

            return chats.Select(c =>
            {
                var lastMessage = c.ChatExpertContents
                    .OrderByDescending(m => m.CreatedAt)
                    .FirstOrDefault();

                return new
                {
                    id = c.ChatExpertId.ToString(),
                    chatExpertId = c.ChatExpertId,
                    expertId = c.ExpertId,
                    expertName = c.Expert != null ? c.Expert.FullName : "Chuyên gia",
                    specialty = "Chuyên gia thú y", // Default specialty
                    lastMessage = lastMessage != null ? lastMessage.Message : "Chưa có tin nhắn",
                    time = lastMessage != null ? lastMessage.CreatedAt : c.CreatedAt,
                    unread = 0, // TODO: Implement unread count if needed
                    isOnline = false, // TODO: Check online status from SignalR
                    createdAt = c.CreatedAt,
                    updatedAt = c.UpdatedAt
                };
            })
            .OrderByDescending(c => c.time);
        }

        public async Task<IEnumerable<object>> GetChatsByExpertIdAsync(int expertId, CancellationToken ct = default)
        {
            Console.WriteLine($"🗄️ [ChatExpertRepository] Querying database for expertId: {expertId}");
            
            var allChats = await _dbSet.ToListAsync(ct);
            Console.WriteLine($"📊 [ChatExpertRepository] Total chats in database: {allChats.Count}");
            Console.WriteLine($"📊 [ChatExpertRepository] All expert IDs: {string.Join(", ", allChats.Select(c => c.ExpertId).Distinct())}");
            
            var result = await _dbSet
                .Include(c => c.Expert)
                .Include(c => c.User)
                .Where(c => c.ExpertId == expertId)
                .Select(c => new
                {
                    chatExpertId = c.ChatExpertId,
                    expertId = c.ExpertId,
                    expertName = c.Expert != null ? c.Expert.FullName : null,
                    expertEmail = c.Expert != null ? c.Expert.Email : null,
                    userId = c.UserId,
                    userName = c.User != null ? c.User.FullName : null,
                    userEmail = c.User != null ? c.User.Email : null,
                    createdAt = c.CreatedAt,
                    updatedAt = c.UpdatedAt
                })
                .ToListAsync(ct);
            
            Console.WriteLine($"✅ [ChatExpertRepository] Query returned {result.Count} chats");
            foreach (var chat in result)
            {
                Console.WriteLine($"   - ChatExpertId: {chat.chatExpertId}, UserId: {chat.userId}, UserName: {chat.userName}");
            }
            
            return result;
        }

        public async Task<ChatExpert?> GetChatExpertByExpertAndUserAsync(int expertId, int userId, CancellationToken ct = default)
        {
            return await _dbSet
                .FirstOrDefaultAsync(c => c.ExpertId == expertId && c.UserId == userId, ct);
        }

        public async Task<bool> ChatExpertExistsAsync(int chatExpertId, CancellationToken ct = default)
        {
            return await _dbSet
                .AnyAsync(c => c.ChatExpertId == chatExpertId, ct);
        }
    }
}

