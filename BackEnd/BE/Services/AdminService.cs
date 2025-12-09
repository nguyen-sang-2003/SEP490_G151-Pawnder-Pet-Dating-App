using BE.DTO;
using BE.Models;
using BE.Repositories.Interfaces;
using BE.Services.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace BE.Services
{
    public class AdminService : IAdminService
    {
        private readonly IExpertConfirmationRepository _expertConfirmationRepository;
        private readonly IUserRepository _userRepository;
        private readonly PawnderDatabaseContext _context;
        private readonly PasswordService _passwordService;

        public AdminService(
            IExpertConfirmationRepository expertConfirmationRepository,
            IUserRepository userRepository,
            PawnderDatabaseContext context,
            PasswordService passwordService)
        {
            _expertConfirmationRepository = expertConfirmationRepository;
            _userRepository = userRepository;
            _context = context;
            _passwordService = passwordService;
        }

        public async Task<object> ReassignExpertConfirmationAsync(ReassignExpertConfirmationRequest req, CancellationToken ct = default)
        {
            // Business logic: Validate user
            var user = await _userRepository.GetByIdAsync(req.UserId, ct);
            if (user == null)
                throw new KeyNotFoundException("Không tìm thấy user.");

            // Business logic: Validate chat
            var chat = await _context.ChatAis.AsNoTracking().FirstOrDefaultAsync(c => c.ChatAiid == req.ChatAiId, ct);
            if (chat == null)
                throw new KeyNotFoundException("Không tìm thấy ChatAI.");

            // Business logic: Validate expert
            var toExpert = await _userRepository.GetByIdAsync(req.ToExpertId, ct);
            if (toExpert == null)
                throw new KeyNotFoundException("Không tìm thấy chuyên gia đích.");

            // Business logic: Find existing confirmation
            var existingQuery = _context.ExpertConfirmations
                .Where(ec => ec.UserId == req.UserId && ec.ChatAiid == req.ChatAiId);
            if (req.FromExpertId.HasValue)
            {
                existingQuery = existingQuery.Where(ec => ec.ExpertId == req.FromExpertId.Value);
            }
            var existing = await existingQuery.FirstOrDefaultAsync(ct);
            if (existing == null)
                throw new KeyNotFoundException("Không tìm thấy yêu cầu xác nhận hiện tại để chuyển.");

            // Business logic: Only allow reassign when status is 'pending'
            if (!string.Equals(existing.Status, "pending", StringComparison.OrdinalIgnoreCase))
                throw new InvalidOperationException("Chỉ cho phép chuyển yêu cầu khi trạng thái là 'pending'.");

            // Business logic: If already assigned to target expert, return existing
            if (existing.ExpertId == req.ToExpertId)
            {
                return new ReassignExpertConfirmationResponse
                {
                    UserId = existing.UserId,
                    ChatAiId = existing.ChatAiid,
                    ExpertId = existing.ExpertId,
                    Status = existing.Status,
                    Message = existing.Message,
                    UserQuestion = existing.UserQuestion,
                    CreatedAt = existing.CreatedAt,
                    UpdatedAt = existing.UpdatedAt,
                    ResultMessage = "Yêu cầu đã thuộc về chuyên gia này."
                };
            }

            // Business logic: Remove old and create new
            var now = DateTime.SpecifyKind(DateTime.UtcNow, DateTimeKind.Unspecified);
            var newStatus = req.KeepStatus ? existing.Status : "pending";
            var newMessage = string.IsNullOrWhiteSpace(req.Message) ? existing.Message : req.Message;

            _context.ExpertConfirmations.Remove(existing);
            var reassigned = new ExpertConfirmation
            {
                UserId = req.UserId,
                ChatAiid = req.ChatAiId,
                ExpertId = req.ToExpertId,
                Status = newStatus,
                Message = newMessage,
                UserQuestion = existing.UserQuestion,
                CreatedAt = existing.CreatedAt ?? now,
                UpdatedAt = now
            };
            _context.ExpertConfirmations.Add(reassigned);
            await _context.SaveChangesAsync(ct);

            return new ReassignExpertConfirmationResponse
            {
                UserId = reassigned.UserId,
                ChatAiId = reassigned.ChatAiid,
                ExpertId = reassigned.ExpertId,
                Status = reassigned.Status,
                Message = reassigned.Message,
                UserQuestion = reassigned.UserQuestion,
                CreatedAt = reassigned.CreatedAt,
                UpdatedAt = reassigned.UpdatedAt,
                ResultMessage = "Đã chuyển yêu cầu xác nhận sang chuyên gia khác."
            };
        }

        public async Task<object> BanUserAsync(int userId, BanUserRequest req, CancellationToken ct = default)
        {
            var user = await _userRepository.GetByIdAsync(userId, ct);
            if (user == null)
                throw new KeyNotFoundException("Không tìm thấy user.");

            // Business logic: Calculate ban end date
            var now = DateTime.Now;
            DateTime? banEnd = null;
            var isPermanent = req.IsPermanent == true;
            if (!isPermanent)
            {
                var days = Math.Max(0, req.DurationDays);
                if (days <= 0)
                    throw new ArgumentException("Cần truyền số ngày (DurationDays > 0) hoặc IsPermanent = true.");
                banEnd = now.AddDays(days);
            }

            // Business logic: Check if user already has an active ban
            var activeBans = await _context.UserBanHistories
                .Where(b => b.UserId == userId && (b.IsActive == true))
                .ToListAsync(ct);
            var hasStillEffectiveBan = activeBans.Any(b => !b.BanEnd.HasValue || b.BanEnd.Value > now);
            if (hasStillEffectiveBan)
            {
                var current = activeBans
                    .OrderByDescending(b => b.BanStart)
                    .First();
                throw new InvalidOperationException($"Người dùng đang bị khóa, không thể tạo lệnh khóa mới. BanStart: {current.BanStart}, BanEnd: {current.BanEnd}, Reason: {current.BanReason}");
            }

            // Business logic: Deactivate expired bans
            foreach (var b in activeBans)
            {
                b.IsActive = false;
                b.BanEnd = b.BanEnd ?? now;
                b.UpdatedAt = now;
            }

            // Business logic: Create new ban
            var entry = new UserBanHistory
            {
                UserId = userId,
                BanStart = now,
                BanEnd = banEnd,
                BanReason = req.Reason,
                CreatedAt = now,
                UpdatedAt = now,
                IsActive = true
            };

            _context.UserBanHistories.Add(entry);

            // Business logic: Set user status to 'Bị khóa'
            var bannedStatus = await _context.UserStatuses
                .AsNoTracking()
                .FirstOrDefaultAsync(s => EF.Functions.ILike(s.UserStatusName, "Bị khóa"), ct);
            if (bannedStatus != null)
            {
                user.UserStatusId = bannedStatus.UserStatusId;
                user.UpdatedAt = now;
            }

            await _context.SaveChangesAsync(ct);

            return new
            {
                message = isPermanent ? "Đã khóa vĩnh viễn người dùng." : "Đã khóa tạm thời người dùng.",
                banStart = entry.BanStart,
                banEnd = entry.BanEnd
            };
        }

        public async Task<object> UnbanUserAsync(int userId, UnbanUserRequest? req, CancellationToken ct = default)
        {
            var user = await _userRepository.GetByIdAsync(userId, ct);
            if (user == null)
                throw new KeyNotFoundException("Không tìm thấy user.");

            var now = DateTime.Now;
            var actives = await _context.UserBanHistories
                .Where(b => b.UserId == userId && (b.IsActive == true))
                .ToListAsync(ct);
            if (actives.Count == 0)
                return new { message = "Người dùng hiện không bị khóa." };

            // Business logic: Deactivate all active bans
            foreach (var b in actives)
            {
                b.IsActive = false;
                b.BanEnd = now;
                b.BanReason = string.IsNullOrWhiteSpace(req?.Reason) ? b.BanReason : $"{b.BanReason} | Unban: {req!.Reason}";
                b.UpdatedAt = now;
            }

            // Business logic: Set user status back based on ACTIVE payment history
            // CRITICAL: Only set PREMIUM if user has a payment with:
            // 1. StatusService = "active" (exact match, case-insensitive)
            // 2. EndDate >= today (payment chưa hết hạn)
            // 3. StartDate <= today (payment đã bắt đầu)
            // Otherwise, set to NORMAL
            var today = DateOnly.FromDateTime(now);
            
            // Step 1: Update expired payments (EndDate < today but StatusService still "active")
            var expiredActivePayments = await _context.PaymentHistories
                .Where(ph => ph.UserId == userId 
                    && ph.StatusService != null
                    && ph.StatusService.ToLower().Trim() == "active"
                    && ph.EndDate.HasValue 
                    && ph.EndDate.Value < today)
                .ToListAsync(ct);
            
            if (expiredActivePayments.Any())
            {
                foreach (var expiredPayment in expiredActivePayments)
                {
                    expiredPayment.StatusService = "pending";
                    expiredPayment.UpdatedAt = now;
                }
                await _context.SaveChangesAsync(ct);
            }
            
            // Step 2: Get ALL payments first for comprehensive check
            var allPayments = await _context.PaymentHistories
                .AsNoTracking()
                .Where(ph => ph.UserId == userId)
                .ToListAsync(ct);
            
            // Step 3: Check for ACTIVE payment (StatusService must be EXACTLY "active" AND EndDate >= today AND StartDate <= today)
            var activePayments = allPayments
                .Where(ph => ph.StatusService != null
                    && ph.StatusService.ToLower().Trim() == "active"  // MUST be "active", not "pending"
                    && ph.EndDate.HasValue 
                    && ph.EndDate.Value >= today  // EndDate >= today
                    && ph.StartDate.HasValue
                    && ph.StartDate.Value <= today)  // Payment must have started
                .ToList();
            
            // CRITICAL: Check if ALL payments are "pending" - if so, FORCE NORMAL
            var allPaymentsArePending = allPayments.Any() && 
                allPayments.All(p => 
                {
                    var status = p.StatusService?.ToLower().Trim() ?? "";
                    return status == "pending";
                });
            
            // Only set PREMIUM if:
            // 1. There's at least one ACTIVE payment (StatusService="active" AND EndDate>=today AND StartDate<=today)
            // 2. AND not all payments are "pending"
            var hasActivePayment = activePayments.Any() && !allPaymentsArePending;

            var targetStatusName = hasActivePayment ? "Tài khoản VIP" : "Tài khoản thường";
            var targetStatus = await _context.UserStatuses
                .AsNoTracking()
                .FirstOrDefaultAsync(s => EF.Functions.ILike(s.UserStatusName, targetStatusName), ct);

            if (targetStatus != null)
            {
                user.UserStatusId = targetStatus.UserStatusId;
                user.UpdatedAt = now;
            }

            await _context.SaveChangesAsync(ct);
            return new { message = "Đã mở khóa người dùng." };
        }

        public async Task<IEnumerable<object>> GetUserBansAsync(int userId, CancellationToken ct = default)
        {
            var exists = await _userRepository.ExistsAsync(u => u.UserId == userId, ct);
            if (!exists)
                throw new KeyNotFoundException("Không tìm thấy user.");

            return await _context.UserBanHistories
                .AsNoTracking()
                .Where(b => b.UserId == userId)
                .OrderByDescending(b => b.BanStart)
                .Select(b => new
                {
                    b.BanId,
                    b.BanStart,
                    b.BanEnd,
                    b.BanReason,
                    b.IsActive,
                    b.CreatedAt,
                    b.UpdatedAt
                })
                .ToListAsync(ct);
        }

        public async Task<bool> UpdateUserByAdminAsync(int userId, AdUserUpdateRequest request, CancellationToken ct = default)
        {
            var entity = await _userRepository.GetByIdAsync(userId, ct);
            if (entity == null)
                throw new KeyNotFoundException("Không tìm thấy user.");

            // Business logic: Update conditionally
            if (request.isDelete.HasValue)
                entity.IsDeleted = request.isDelete.Value;

            // Business logic: Nếu đang update RoleId thành Expert (2), đảm bảo UserStatusId = 2 (NORMAL)
            if (request.RoleId.HasValue && request.RoleId.Value == 2)
            {
                // Khi chuyển thành Expert, luôn set trạng thái NORMAL
                entity.RoleId = 2;
                entity.UserStatusId = 2;
            }
            else if (request.RoleId.HasValue)
            {
                // Các role khác, chỉ update RoleId
                entity.RoleId = request.RoleId.Value;
            }

            // Business logic: Update UserStatusId (nhưng không áp dụng nếu đang chuyển thành Expert)
            if (request.userStatusId.HasValue && !(request.RoleId.HasValue && request.RoleId.Value == 2))
            {
                entity.UserStatusId = request.userStatusId.Value;
            }

            entity.UpdatedAt = DateTime.Now;
            await _userRepository.UpdateAsync(entity, ct);

            return true;
        }

        public async Task<UserResponse> RegisterUserByAdminAsync(AdUserCreateRequest req, CancellationToken ct = default)
        {
            // Business logic: Check email exists
            var emailExists = await _userRepository.EmailExistsAsync(req.Email, ct);
            if (emailExists)
                throw new InvalidOperationException("Email đã tồn tại");

            // Business logic: Hash password
            var hashed = _passwordService.HashPassword(req.Password);

            var now = DateTime.Now;
            
            // Business logic: Expert (RoleId = 2) luôn có trạng thái NORMAL (UserStatusId = 2)
            // Bất kể giá trị UserStatusId nào được truyền vào
            int? desiredStatusId;
            if (req.RoleId == 2) // Expert role
            {
                // Expert mới tạo luôn có trạng thái NORMAL (statusId = 2)
                desiredStatusId = 2;
            }
            else
            {
                // Các role khác sử dụng UserStatusId được truyền vào hoặc default = 2
                desiredStatusId = req.UserStatusId ?? 2;
            }

            var entity = new User
            {
                RoleId = req.RoleId,
                UserStatusId = desiredStatusId,
                FullName = req.FullName,
                Gender = req.Gender,
                Email = req.Email,
                PasswordHash = hashed,
                IsProfileComplete = req.IsProfileComplete ?? (req.RoleId == 2),
                IsDeleted = false,
                CreatedAt = now,
                UpdatedAt = now
            };

            await _userRepository.AddAsync(entity, ct);

            return new UserResponse
            {
                UserId = entity.UserId,
                RoleId = entity.RoleId,
                UserStatusId = entity.UserStatusId,
                AddressId = entity.AddressId,
                FullName = entity.FullName,
                Gender = entity.Gender,
                Email = entity.Email,
                ProviderLogin = entity.ProviderLogin,
                isProfileComplete = entity.IsProfileComplete,
                IsDeleted = entity.IsDeleted ?? false,
                CreatedAt = entity.CreatedAt,
                UpdatedAt = entity.UpdatedAt
            };
        }
    }
}




