using BE.Models;
using Microsoft.EntityFrameworkCore;

namespace BE.Services
{
    public class DailyLimitService
    {
        private readonly PawnderDatabaseContext _context;

        // Định nghĩa limit cho từng loại action
        // 🧪 TEST MODE: Giảm limits để dễ test
        private readonly Dictionary<string, (int NormalLimit, int VipLimit)> _actionLimits = new()
        {
            { "request_match", (2, 10) },          // Request match: thường 3, VIP 10 (Production: 20, 100)
            { "ai_chat_question", (2, 15) },       // AI chat question: thường 5, VIP 15 (Production: 30, 150)
            { "expert_confirm", (1, 5) }           // Expert confirm: thường 2, VIP 5 (Production: 3, 10)
            // ❌ ai_filter: REMOVED - không giới hạn, user có thể filter pet thoải mái
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
                return isVip ? limits.VipLimit : limits.NormalLimit;
            }

            // Nếu không tìm thấy action type, trả về limit mặc định
            return -1;
        }

        // Kiểm tra user có thể thực hiện action không (chưa vượt quá limit)
        public async Task<bool> CanPerformAction(int userId, string actionType)
        {
            var today = DateOnly.FromDateTime(DateTime.Now);
            
            // Lấy limit cho action này
            int limit = await GetLimitForActionAsync(userId, actionType);

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
            int limit = await GetLimitForActionAsync(userId, actionType);
            if (limit == -1) return 0; // Action type không hợp lệ

            int currentCount = await GetActionCountToday(userId, actionType);
            int remaining = limit - currentCount;
            
            return remaining > 0 ? remaining : 0;
        }
    }
}

