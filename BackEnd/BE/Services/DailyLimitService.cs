using BE.Models;
using BE.Services.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace BE.Services
{
    public class DailyLimitService : IDailyLimitService
    {
        private readonly PawnderDatabaseContext _context;

        // Định nghĩa limit cho từng loại action
        // ⭐ MÔ HÌNH FREEMIUM:
        // - Free users: 10,000 tokens/ngày
        // - VIP users: 50,000 tokens/ngày (5x nhiều hơn)
        private const int FREE_TOKENS_PER_DAY = 10000;
        private const int VIP_TOKENS_PER_DAY = 50000;
        
        private readonly Dictionary<string, (int FreeQuota, int VipLimit)> _actionLimits = new()
        {
            { "request_match", (10, 30) },          // Request match: 10 free/ngày, VIP 50
            { "expert_confirm", (2, 10) },         // Expert confirm: 2 free/ngày, VIP 10
            { "expert_chat", (5, 15) }             // Expert chat: 5 tin nhắn free/ngày, VIP unlimited (-1)
            // ai_chat_question: Xử lý riêng bằng FREE_TOKENS_PER_DAY
        };

        public DailyLimitService(PawnderDatabaseContext context)
        {
            _context = context;
        }

        // Kiểm tra user có phải VIP không (dựa vào PaymentHistory có gói đang active)
        private async Task<bool> IsVipUserAsync(int userId)
        {
            var today = DateOnly.FromDateTime(DateTime.Now);
            
            var hasActiveVip = await _context.PaymentHistories
                .AnyAsync(p => p.UserId == userId 
                    && p.StatusService != null 
                    && (p.StatusService.ToLower().Contains("active"))
                    && p.StartDate <= today 
                    && p.EndDate >= today);

            return hasActiveVip;
        }

        // Lấy limit cho action type dựa vào user là VIP hay thường
        private async Task<int> GetLimitForActionAsync(int userId, string actionType)
        {
            bool isVip = await IsVipUserAsync(userId);
            
            if (_actionLimits.TryGetValue(actionType.ToLower(), out var limits))
            {
                return isVip ? limits.VipLimit : limits.FreeQuota;
            }

            // Nếu không tìm thấy action type, trả về limit mặc định
            return -1;
        }

        // Lấy free quota cho action (cho user thường)
        public async Task<int> GetFreeQuotaForAction(string actionType)
        {
            if (actionType.ToLower() == "ai_chat_question")
            {
                return FREE_TOKENS_PER_DAY;  // Trả về số tokens, không phải số lượt
            }
            
            if (_actionLimits.TryGetValue(actionType.ToLower(), out var limits))
            {
                return limits.FreeQuota;
            }
            return 0;
        }

        // Lấy số tokens free đã dùng hôm nay cho AI chat
        public async Task<int> GetFreeTokensUsedToday(int userId)
        {
            var today = DateOnly.FromDateTime(DateTime.Now);
            
            var dailyLimit = await _context.DailyLimits
                .FirstOrDefaultAsync(dl => dl.UserId == userId 
                    && dl.ActionType.ToLower() == "ai_chat_question" 
                    && dl.ActionDate == today);

            return dailyLimit?.Count ?? 0;  // Count lưu số tokens đã dùng
        }

        // Ghi nhận số tokens đã dùng (cho AI chat)
        public async Task<bool> RecordTokenUsage(int userId, int tokensUsed)
        {
            var today = DateOnly.FromDateTime(DateTime.Now);
            
            var dailyLimit = await _context.DailyLimits
                .FirstOrDefaultAsync(dl => dl.UserId == userId 
                    && dl.ActionType.ToLower() == "ai_chat_question" 
                    && dl.ActionDate == today);

            if (dailyLimit == null)
            {
                dailyLimit = new DailyLimit
                {
                    UserId = userId,
                    ActionType = "ai_chat_question",
                    ActionDate = today,
                    Count = tokensUsed,
                    CreatedAt = DateTime.Now
                };
                _context.DailyLimits.Add(dailyLimit);
            }
            else
            {
                dailyLimit.Count = (dailyLimit.Count ?? 0) + tokensUsed;
            }

            await _context.SaveChangesAsync();
            return true;
        }

        // Kiểm tra user có thể thực hiện action không (chưa vượt quá limit)
        public async Task<bool> CanPerformAction(int userId, string actionType)
        {
            var today = DateOnly.FromDateTime(DateTime.Now);
            
            // Lấy limit cho action này
            int limit = await GetLimitForActionAsync(userId, actionType);

            // Nếu limit là -1 (unlimited) thì luôn cho phép
            if (limit == -1)
            {
                return true;
            }

            // Tìm record limit của user cho action này trong ngày hôm nay
            var dailyLimit = await _context.DailyLimits
                .FirstOrDefaultAsync(dl => dl.UserId == userId 
                    && dl.ActionType.ToLower() == actionType.ToLower() 
                    && dl.ActionDate == today);

            // Nếu chưa có record hoặc count < limit thì được phép
            if (dailyLimit == null)
            {
                return true; // Chưa có record nghĩa là chưa thực hiện lần nào
            }

            return dailyLimit.Count < limit;
        }

        // Ghi nhận action đã thực hiện và tăng count. Trả về true nếu thành công, false nếu vượt limit
        public async Task<bool> RecordAction(int userId, string actionType)
        {
            var today = DateOnly.FromDateTime(DateTime.Now);
            
            // Kiểm tra có thể thực hiện không
            bool canPerform = await CanPerformAction(userId, actionType);
            if (!canPerform)
            {
                return false; // Đã vượt quá limit
            }

            // Tìm hoặc tạo record limit
            var dailyLimit = await _context.DailyLimits
                .FirstOrDefaultAsync(dl => dl.UserId == userId 
                    && dl.ActionType.ToLower() == actionType.ToLower() 
                    && dl.ActionDate == today);

            if (dailyLimit == null)
            {
                // Tạo mới record
                dailyLimit = new DailyLimit
                {
                    UserId = userId,
                    ActionType = actionType,
                    ActionDate = today,
                    Count = 1,
                    CreatedAt = DateTime.Now
                };
                _context.DailyLimits.Add(dailyLimit);
            }
            else
            {
                // Tăng count
                dailyLimit.Count = dailyLimit.Count + 1;
            }

            await _context.SaveChangesAsync();
            return true;
        }

        // Lấy số lần đã thực hiện action trong ngày
        public async Task<int> GetActionCountToday(int userId, string actionType)
        {
            var today = DateOnly.FromDateTime(DateTime.Now);
            
            var dailyLimit = await _context.DailyLimits
                .FirstOrDefaultAsync(dl => dl.UserId == userId 
                    && dl.ActionType.ToLower() == actionType.ToLower() 
                    && dl.ActionDate == today);

            return dailyLimit?.Count ?? 0;
        }

        // Lấy số lần còn lại cho action type
        public async Task<int> GetRemainingCount(int userId, string actionType)
        {
            return await GetRemainingCountAsync(userId, actionType);
        }

        public async Task<int> GetRemainingCountAsync(int userId, string actionType, CancellationToken ct = default)
        {
            int limit = await GetLimitForActionAsync(userId, actionType);
            if (limit == -1) return 0; // Action type không hợp lệ

            int currentCount = await GetActionCountToday(userId, actionType);
            int remaining = limit - currentCount;
            
            return remaining > 0 ? remaining : 0;
        }
    }
}

