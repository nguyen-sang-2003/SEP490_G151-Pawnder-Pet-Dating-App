using BE.Models;
using BE.Repositories.Interfaces;
using BE.Services.Interfaces;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;

namespace BE.Services
{
    public class MatchService : IMatchService
    {
        private readonly IChatUserRepository _chatUserRepository;
        private readonly IBlockRepository _blockRepository;
        private readonly INotificationRepository _notificationRepository;
        private readonly PawnderDatabaseContext _context;
        private readonly IHubContext<ChatHub> _hubContext;
        private readonly DailyLimitService _dailyLimitService;

        public MatchService(
            IChatUserRepository chatUserRepository,
            IBlockRepository blockRepository,
            INotificationRepository notificationRepository,
            PawnderDatabaseContext context,
            IHubContext<ChatHub> hubContext,
            DailyLimitService dailyLimitService)
        {
            _chatUserRepository = chatUserRepository;
            _blockRepository = blockRepository;
            _notificationRepository = notificationRepository;
            _context = context;
            _hubContext = hubContext;
            _dailyLimitService = dailyLimitService;
        }

        public async Task<IEnumerable<object>> GetLikesReceivedAsync(int userId, int? petId, CancellationToken ct = default)
        {
            // Business logic: Get blocked users (both directions)
            var blockedByMe = await _context.Blocks
                .Where(b => b.FromUserId == userId)
                .Select(b => b.ToUserId)
                .ToListAsync(ct);

            var blockedMe = await _context.Blocks
                .Where(b => b.ToUserId == userId)
                .Select(b => b.FromUserId)
                .ToListAsync(ct);

            var allBlockedUserIds = blockedByMe.Union(blockedMe).ToList();

            // Business logic: Build query for match requests (both pending and accepted) excluding blocked users
            var query = _context.ChatUsers
                .Include(c => c.FromUser)
                    .ThenInclude(u => u!.Address)
                .Include(c => c.FromUser)
                    .ThenInclude(u => u!.Pets.Where(p => p.IsDeleted == false))
                        .ThenInclude(p => p.PetPhotos.Where(pp => pp.IsDeleted == false))
                .Include(c => c.ToUser)
                    .ThenInclude(u => u!.Address)
                .Include(c => c.ToUser)
                    .ThenInclude(u => u!.Pets.Where(p => p.IsDeleted == false))
                        .ThenInclude(p => p.PetPhotos.Where(pp => pp.IsDeleted == false))
                .Include(c => c.FromPet)
                    .ThenInclude(p => p.PetPhotos.Where(pp => pp.IsDeleted == false))
                .Include(c => c.ToPet)
                    .ThenInclude(p => p.PetPhotos.Where(pp => pp.IsDeleted == false))
                .Where(c => c.IsDeleted == false &&
                           (
                               (c.ToUserId == userId && c.Status == "Pending") ||
                               ((c.FromUserId == userId || c.ToUserId == userId) && c.Status == "Accepted")
                           ) &&
                           c.FromUserId != null && c.ToUserId != null &&
                           !allBlockedUserIds.Contains(c.FromUserId.Value) &&
                           !allBlockedUserIds.Contains(c.ToUserId.Value));

            // Business logic: Filter by petId if provided
            if (petId.HasValue)
            {
                query = query.Where(c => c.FromPetId == petId.Value || c.ToPetId == petId.Value);
            }

            var allMatchRequests = await query.ToListAsync(ct);

            var result = allMatchRequests.Select(c =>
            {
                // Business logic: Determine if this is a match (Accepted) or pending like
                bool isMatch = c.Status == "Accepted";

                // Business logic: Get the OTHER user and pet (from match, not active pet)
                var otherUser = c.ToUserId == userId ? c.FromUser : c.ToUser;
                var otherPetId = c.ToUserId == userId ? c.FromPetId : c.ToPetId;
                var otherUserPet = otherUser?.Pets?.FirstOrDefault(p => p.PetId == otherPetId && p.IsDeleted == false);

                return new
                {
                    matchId = c.MatchId,
                    fromUserId = c.FromUserId,
                    status = c.Status,
                    createdAt = c.CreatedAt,
                    isMatch = isMatch,
                    owner = otherUser != null ? new
                    {
                        userId = otherUser.UserId,
                        fullName = otherUser.FullName,
                        gender = otherUser.Gender,
                        address = otherUser.Address != null ? new
                        {
                            city = otherUser.Address.City,
                            district = otherUser.Address.District,
                            ward = otherUser.Address.Ward,
                            latitude = otherUser.Address.Latitude,
                            longitude = otherUser.Address.Longitude
                        } : null
                    } : null,
                    pet = otherUserPet != null ? new
                    {
                        petId = otherUserPet.PetId,
                        name = otherUserPet.Name,
                        breed = otherUserPet.Breed,
                        gender = otherUserPet.Gender,
                        age = otherUserPet.Age,
                        description = otherUserPet.Description
                    } : null,
                    petPhotos = otherUserPet?.PetPhotos?
                        .Where(photo => photo.IsDeleted == false)
                        .OrderBy(photo => photo.SortOrder)
                        .Select(photo => photo.ImageUrl)
                        .ToList() ?? new List<string>()
                };
            }).OrderByDescending(x => x.createdAt).ToList();

            return result;
        }

        public async Task<object> GetStatsAsync(int userId, CancellationToken ct = default)
        {
            // Business logic: Count matches (Accepted status where user is involved)
            var matchesCount = await _context.ChatUsers
                .Where(c => c.IsDeleted == false
                           && c.Status == "Accepted"
                           && (c.FromUserId == userId || c.ToUserId == userId))
                .CountAsync(ct);

            // Business logic: Count likes received (Pending status where user is recipient)
            var likesCount = await _context.ChatUsers
                .Where(c => c.IsDeleted == false
                           && c.Status == "Pending"
                           && c.ToUserId == userId)
                .CountAsync(ct);

            return new
            {
                matches = matchesCount,
                likes = likesCount
            };
        }

        public async Task<object> SendLikeAsync(LikeRequest request, CancellationToken ct = default)
        {
            // Business logic: Check daily limit
            bool canMatch = await _dailyLimitService.CanPerformAction(request.FromUserId, "request_match");
            if (!canMatch)
            {
                int remaining = await _dailyLimitService.GetRemainingCount(request.FromUserId, "request_match");
                throw new InvalidOperationException($"Bạn đã hết lượt gửi match hôm nay! Nâng cấp lên VIP để sử dụng không giới hạn. Còn lại: {remaining}");
            }

            if (request.FromUserId == request.ToUserId)
                throw new InvalidOperationException("Cannot like yourself");

            // Business logic: Check if blocked by target user (silent reject)
            var isBlocked = await _blockRepository.GetBlockAsync(request.ToUserId, request.FromUserId, ct) != null;
            if (isBlocked)
            {
                // Return success but don't create anything (user doesn't know they're blocked)
                return new
                {
                    matchId = 0,
                    fromUserId = request.FromUserId,
                    toUserId = request.ToUserId,
                    status = "Rejected",
                    isMatch = false,
                    message = "Request processed"
                };
            }

            // Business logic: Check if already exists (sent by current user with SAME pet pair)
            var existingLike = await _context.ChatUsers
                .FirstOrDefaultAsync(c => c.FromUserId == request.FromUserId
                                        && c.ToUserId == request.ToUserId
                                        && c.FromPetId == request.FromPetId
                                        && c.ToPetId == request.ToPetId
                                        && c.IsDeleted == false, ct);

            if (existingLike != null)
                throw new InvalidOperationException("Already liked this pet");

            // Business logic: Check if the other user already liked us (mutual like with REVERSED pet pair)
            var reciprocalLike = await _context.ChatUsers
                .FirstOrDefaultAsync(c => c.FromUserId == request.ToUserId
                                        && c.ToUserId == request.FromUserId
                                        && c.FromPetId == request.ToPetId
                                        && c.ToPetId == request.FromPetId
                                        && c.IsDeleted == false, ct);

            if (reciprocalLike != null)
            {
                // Business logic: It's a match! Update to Accepted
                reciprocalLike.Status = "Accepted";
                reciprocalLike.UpdatedAt = DateTime.Now;
                await _chatUserRepository.UpdateAsync(reciprocalLike, ct);

                // Business logic: Record action to daily limit
                await _dailyLimitService.RecordAction(request.FromUserId, "request_match");
                int remaining = await _dailyLimitService.GetRemainingCount(request.FromUserId, "request_match");
                Console.WriteLine($"✅ Mutual match recorded. User {request.FromUserId} has {remaining} matches remaining today.");

                // Business logic: Get user names and pets for notifications
                var user1 = await _context.Users.FindAsync(request.FromUserId);
                var user2 = await _context.Users.FindAsync(request.ToUserId);

                // Business logic: Get pets involved in this match with photos
                var pet1 = await _context.Pets
                    .Include(p => p.PetPhotos.Where(pp => pp.IsDeleted == false))
                    .Where(p => p.PetId == request.FromPetId && p.IsDeleted == false)
                    .FirstOrDefaultAsync(ct);
                var pet2 = await _context.Pets
                    .Include(p => p.PetPhotos.Where(pp => pp.IsDeleted == false))
                    .Where(p => p.PetId == request.ToPetId && p.IsDeleted == false)
                    .FirstOrDefaultAsync(ct);

                var pet1Photo = pet1?.PetPhotos?
                    .OrderBy(pp => pp.SortOrder)
                    .ThenBy(pp => pp.PhotoId)
                    .Select(pp => pp.ImageUrl)
                    .FirstOrDefault();
                var pet2Photo = pet2?.PetPhotos?
                    .OrderBy(pp => pp.SortOrder)
                    .ThenBy(pp => pp.PhotoId)
                    .Select(pp => pp.ImageUrl)
                    .FirstOrDefault();

                // Business logic: Create notification for both users
                await CreateMatchNotification(request.FromUserId, request.ToUserId, reciprocalLike.MatchId, ct);

                // Business logic: Send real-time match notifications to both users
                if (user1 != null && user2 != null)
                {
                    await ChatHub.SendMatchNotification(_hubContext, request.FromUserId, user2.FullName, request.ToUserId, reciprocalLike.MatchId, pet2?.Name, pet2Photo);
                    await ChatHub.SendMatchNotification(_hubContext, request.ToUserId, user1.FullName, request.FromUserId, reciprocalLike.MatchId, pet1?.Name, pet1Photo);
                }

                return new
                {
                    matchId = reciprocalLike.MatchId,
                    fromUserId = reciprocalLike.FromUserId,
                    toUserId = reciprocalLike.ToUserId,
                    status = reciprocalLike.Status,
                    isMatch = true,
                    message = "It's a match!"
                };
            }

            // Business logic: No mutual like yet, just create pending
            var chatUser = new ChatUser
            {
                FromUserId = request.FromUserId,
                ToUserId = request.ToUserId,
                FromPetId = request.FromPetId,
                ToPetId = request.ToPetId,
                Status = "Pending",
                IsDeleted = false,
                CreatedAt = DateTime.Now,
                UpdatedAt = DateTime.Now
            };

            await _chatUserRepository.AddAsync(chatUser, ct);

            // Business logic: Record action to daily limit
            bool recorded = await _dailyLimitService.RecordAction(request.FromUserId, "request_match");
            if (recorded)
            {
                int remaining = await _dailyLimitService.GetRemainingCount(request.FromUserId, "request_match");
                Console.WriteLine($"✅ Match recorded. User {request.FromUserId} has {remaining} matches remaining today.");
            }

            // Business logic: Send real-time badge notification to recipient
            await SendLikeNotification(request.ToUserId, request.FromUserId);

            // Business logic: Get remaining count for response
            int remainingMatches = await _dailyLimitService.GetRemainingCount(request.FromUserId, "request_match");

            return new
            {
                matchId = chatUser.MatchId,
                fromUserId = chatUser.FromUserId,
                toUserId = chatUser.ToUserId,
                status = chatUser.Status,
                isMatch = false,
                message = "Like sent",
                remainingMatches = remainingMatches
            };
        }

        public async Task<object> RespondToLikeAsync(RespondRequest request, CancellationToken ct = default)
        {
            // Business logic: For "pass" action, allow both Pending and Accepted status (for unmatch)
            var chatUser = request.Action.ToLower() == "pass"
                ? await _context.ChatUsers.FirstOrDefaultAsync(c => c.MatchId == request.MatchId && c.IsDeleted == false, ct)
                : await _context.ChatUsers.FirstOrDefaultAsync(c => c.MatchId == request.MatchId && c.Status == "Pending", ct);

            if (chatUser == null)
                throw new KeyNotFoundException("Like request not found");

            if (request.Action.ToLower() == "match")
            {
                // Business logic: Accept the like - it's a match!
                chatUser.Status = "Accepted";
                chatUser.UpdatedAt = DateTime.Now;
                await _chatUserRepository.UpdateAsync(chatUser, ct);

                // Business logic: Get user names and pets for notifications
                var user1 = await _context.Users.FindAsync(chatUser.FromUserId);
                var user2 = await _context.Users.FindAsync(chatUser.ToUserId);

                // Business logic: Get pets involved in this match with photos
                var pet1 = await _context.Pets
                    .Include(p => p.PetPhotos.Where(pp => pp.IsDeleted == false))
                    .Where(p => p.PetId == chatUser.FromPetId && p.IsDeleted == false)
                    .FirstOrDefaultAsync(ct);
                var pet2 = await _context.Pets
                    .Include(p => p.PetPhotos.Where(pp => pp.IsDeleted == false))
                    .Where(p => p.PetId == chatUser.ToPetId && p.IsDeleted == false)
                    .FirstOrDefaultAsync(ct);

                var pet1Photo = pet1?.PetPhotos?
                    .OrderBy(pp => pp.SortOrder)
                    .ThenBy(pp => pp.PhotoId)
                    .Select(pp => pp.ImageUrl)
                    .FirstOrDefault();
                var pet2Photo = pet2?.PetPhotos?
                    .OrderBy(pp => pp.SortOrder)
                    .ThenBy(pp => pp.PhotoId)
                    .Select(pp => pp.ImageUrl)
                    .FirstOrDefault();

                // Business logic: Create notification
                await CreateMatchNotification(chatUser.FromUserId!.Value, chatUser.ToUserId!.Value, chatUser.MatchId, ct);

                // Business logic: Send real-time match notifications to both users
                if (user1 != null && user2 != null)
                {
                    await ChatHub.SendMatchNotification(_hubContext, chatUser.FromUserId.Value, user2.FullName, chatUser.ToUserId.Value, chatUser.MatchId, pet2?.Name, pet2Photo);
                    await ChatHub.SendMatchNotification(_hubContext, chatUser.ToUserId.Value, user1.FullName, chatUser.FromUserId.Value, chatUser.MatchId, pet1?.Name, pet1Photo);
                }

                return new
                {
                    matchId = chatUser.MatchId,
                    status = chatUser.Status,
                    isMatch = true,
                    message = "It's a match!"
                };
            }
            else if (request.Action.ToLower() == "pass")
            {
                // Business logic: Reject/Unmatch - soft delete to keep data for review
                chatUser.IsDeleted = true;
                chatUser.UpdatedAt = DateTime.SpecifyKind(DateTime.UtcNow, DateTimeKind.Unspecified);
                await _chatUserRepository.UpdateAsync(chatUser, ct);

                // DO NOT notify the other user when unmatched
                return new { message = chatUser.Status == "Accepted" ? "Unmatched" : "Passed" };
            }
            else
            {
                throw new ArgumentException("Invalid action. Use 'match' or 'pass'");
            }
        }

        public async Task<object> GetBadgeCountsAsync(int userId, int? petId, CancellationToken ct = default)
        {
            // Business logic: Get all accepted matches for this user
            var query = _context.ChatUsers
                .Where(c => c.IsDeleted == false
                           && c.Status == "Accepted"
                           && (c.FromUserId == userId || c.ToUserId == userId));

            // Business logic: Filter by petId if provided
            if (petId.HasValue)
            {
                query = query.Where(c => c.FromPetId == petId.Value || c.ToPetId == petId.Value);
            }

            var acceptedMatches = await query
                .Select(c => c.MatchId)
                .ToListAsync(ct);

            // Business logic: Get list of matchIds with unread messages (Messenger-style)
            var unreadChats = new List<int>();
            foreach (var matchId in acceptedMatches)
            {
                var lastMessage = await _context.ChatUserContents
                    .Where(c => c.MatchId == matchId)
                    .OrderByDescending(c => c.CreatedAt)
                    .FirstOrDefaultAsync(ct);

                if (lastMessage != null && lastMessage.FromUserId != userId)
                {
                    // Last message is from other user = unread
                    unreadChats.Add(matchId);
                }
            }

            // Business logic: Count pending likes (people who liked you)
            var pendingLikesQuery = _context.ChatUsers
                .Where(c => c.IsDeleted == false
                           && c.Status == "Pending"
                           && c.ToUserId == userId);

            // Business logic: Filter by petId if provided
            if (petId.HasValue)
            {
                pendingLikesQuery = pendingLikesQuery.Where(c => c.ToPetId == petId.Value);
            }

            var pendingLikesCount = await pendingLikesQuery.CountAsync(ct);

            return new
            {
                unreadChats = unreadChats,
                favoriteBadge = pendingLikesCount
            };
        }

        private async Task CreateMatchNotification(int userId1, int userId2, int matchId, CancellationToken ct = default)
        {
            try
            {
                var user1 = await _context.Users.FindAsync(userId1);
                var user2 = await _context.Users.FindAsync(userId2);

                if (user1 != null && user2 != null)
                {
                    // Business logic: Notification for user 1
                    var notification1 = new Notification
                    {
                        UserId = userId1,
                        Title = "New Match! 🎉",
                        Message = $"You matched with {user2.FullName}! Start chatting now.",
                        CreatedAt = DateTime.Now
                    };

                    // Business logic: Notification for user 2
                    var notification2 = new Notification
                    {
                        UserId = userId2,
                        Title = "New Match! 🎉",
                        Message = $"You matched with {user1.FullName}! Start chatting now.",
                        CreatedAt = DateTime.Now
                    };

                    await _notificationRepository.AddAsync(notification1, ct);
                    await _notificationRepository.AddAsync(notification2, ct);
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[CreateMatchNotification] Error: {ex.Message}");
                // Don't throw - notifications are not critical
            }
        }

        private async Task SendLikeNotification(int toUserId, int fromUserId)
        {
            try
            {
                await ChatHub.SendNewLikeBadge(_hubContext, toUserId, fromUserId);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[SendLikeNotification] Error: {ex.Message}");
            }
        }
    }
}

