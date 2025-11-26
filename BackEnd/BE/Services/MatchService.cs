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
            // Use ChatUser.FromUserId and ChatUser.ToUserId directly for filtering (more reliable than navigation properties)
            // 🚀 OPTIMIZED: Reduced nested includes for better performance
            var query = _context.ChatUsers
                .Include(c => c.FromPet)
                    .ThenInclude(p => p.User)
                        .ThenInclude(u => u!.Address)
                .Include(c => c.FromPet)
                    .ThenInclude(p => p.PetPhotos.Where(pp => pp.IsDeleted == false))
                .Include(c => c.FromPet)
                    .ThenInclude(p => p.PetCharacteristics)
                        .ThenInclude(pc => pc.Attribute)
                .Include(c => c.ToPet)
                    .ThenInclude(p => p.User)
                        .ThenInclude(u => u!.Address)
                .Include(c => c.ToPet)
                    .ThenInclude(p => p.PetPhotos.Where(pp => pp.IsDeleted == false))
                .Include(c => c.ToPet)
                    .ThenInclude(p => p.PetCharacteristics)
                        .ThenInclude(pc => pc.Attribute)
                .Where(c => c.IsDeleted == false &&
                           c.FromUserId != null && c.ToUserId != null &&
                           (
                               (c.ToUserId == userId && c.Status == "Pending") ||
                               ((c.FromUserId == userId || c.ToUserId == userId) && c.Status == "Accepted")
                           ) &&
                           !allBlockedUserIds.Contains(c.FromUserId.Value) &&
                           !allBlockedUserIds.Contains(c.ToUserId.Value));

            // Business logic: Filter by petId if provided
            // For Pending likes: only show likes received by this pet (ToPetId)
            // For Accepted matches: show matches involving this pet (either direction)
            if (petId.HasValue)
            {
                query = query.Where(c => 
                    (c.Status == "Pending" && c.ToPetId == petId.Value) ||
                    (c.Status == "Accepted" && (c.FromPetId == petId.Value || c.ToPetId == petId.Value))
                );
            }

            var allMatchRequests = await query.ToListAsync(ct);

            var result = allMatchRequests.Select(c =>
            {
                // Business logic: Determine if this is a match (Accepted) or pending like
                bool isMatch = c.Status == "Accepted";

                // Business logic: Get the OTHER user and pet (from match, not active pet)
                // 🚀 OPTIMIZED: Get pet directly from FromPet/ToPet instead of User.Pets
                var fromUserId = c.FromUserId ?? c.FromPet?.UserId;
                var toUserId = c.ToUserId ?? c.ToPet?.UserId;
                var otherUser = toUserId == userId ? c.FromPet?.User : c.ToPet?.User;
                var otherUserPet = toUserId == userId ? c.FromPet : c.ToPet;

                // Business logic: Get Age from both Pet.Age (old) and PetCharacteristic (new)
                // Priority: PetCharacteristic > Pet.Age
                int? age = otherUserPet?.Age;
                if (otherUserPet != null)
                {
                    var ageChar = otherUserPet.PetCharacteristics
                        .FirstOrDefault(pc => pc.Attribute != null &&
                                             (pc.Attribute.Name.ToLower() == "tuổi" ||
                                              pc.Attribute.Name.ToLower() == "age"));
                    if (ageChar != null && ageChar.Value.HasValue)
                    {
                        age = (int)Math.Round((double)ageChar.Value.Value);
                    }
                }

                return new
                {
                    matchId = c.MatchId,
                    fromUserId = fromUserId,
                    toUserId = toUserId,
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
                        age = age,
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
            // Business logic: Get user's pet IDs
            var userPetIds = await _context.Pets
                .Where(p => p.UserId == userId && p.IsDeleted == false)
                .Select(p => p.PetId)
                .ToListAsync(ct);

            if (!userPetIds.Any())
            {
                return new { matches = 0, likes = 0 };
            }

            var userPetIdSet = userPetIds.ToHashSet();

            // Business logic: Count matches (Accepted status where user's pets are involved)
            var matchesCount = await _context.ChatUsers
                .Include(c => c.FromPet)
                .Include(c => c.ToPet)
                .Where(c => c.IsDeleted == false
                           && c.Status == "Accepted"
                           && c.FromPet != null && c.ToPet != null
                           && (userPetIdSet.Contains(c.FromPetId ?? -1) || userPetIdSet.Contains(c.ToPetId ?? -1)))
                .CountAsync(ct);

            // Business logic: Count likes received (Pending status where user's pets are recipient)
            var likesCount = await _context.ChatUsers
                .Include(c => c.ToPet)
                .Where(c => c.IsDeleted == false
                           && c.Status == "Pending"
                           && c.ToPet != null
                           && userPetIdSet.Contains(c.ToPetId ?? -1))
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
                .Include(c => c.FromPet)
                .Include(c => c.ToPet)
                .FirstOrDefaultAsync(c => c.FromPet != null && c.ToPet != null
                                        && c.FromPet.UserId == request.FromUserId
                                        && c.ToPet.UserId == request.ToUserId
                                        && c.FromPetId == request.FromPetId
                                        && c.ToPetId == request.ToPetId
                                        && c.IsDeleted == false, ct);

            if (existingLike != null)
                throw new InvalidOperationException("Already liked this pet");

            // Business logic: Check if the other user already liked us (mutual like with REVERSED pet pair)
            var reciprocalLike = await _context.ChatUsers
                .Include(c => c.FromPet)
                .Include(c => c.ToPet)
                .FirstOrDefaultAsync(c => c.FromPet != null && c.ToPet != null
                                        && c.FromPet.UserId == request.ToUserId
                                        && c.ToPet.UserId == request.FromUserId
                                        && c.FromPetId == request.ToPetId
                                        && c.ToPetId == request.FromPetId
                                        && c.IsDeleted == false, ct);

            if (reciprocalLike != null)
            {
                // Business logic: It's a match! Update to Accepted
                reciprocalLike.Status = "Accepted";
                reciprocalLike.UpdatedAt = DateTime.Now;
                await _chatUserRepository.UpdateAsync(reciprocalLike, ct);

                // Business logic: Validate user ID consistency for mutual match
                if (reciprocalLike.FromPet?.UserId != null && 
                    reciprocalLike.FromUserId != reciprocalLike.FromPet.UserId)
                {
                    Console.WriteLine($"⚠️ WARNING: User ID mismatch detected in ChatUser {reciprocalLike.MatchId}. " +
                                    $"FromUserId={reciprocalLike.FromUserId}, FromPet.UserId={reciprocalLike.FromPet.UserId}");
                }

                if (reciprocalLike.ToPet?.UserId != null && 
                    reciprocalLike.ToUserId != reciprocalLike.ToPet.UserId)
                {
                    Console.WriteLine($"⚠️ WARNING: User ID mismatch detected in ChatUser {reciprocalLike.MatchId}. " +
                                    $"ToUserId={reciprocalLike.ToUserId}, ToPet.UserId={reciprocalLike.ToPet.UserId}");
                }

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

                var fromUserId = reciprocalLike.FromPet?.UserId;
                var toUserId = reciprocalLike.ToPet?.UserId;

                return new
                {
                    matchId = reciprocalLike.MatchId,
                    fromUserId = fromUserId,
                    toUserId = toUserId,
                    status = reciprocalLike.Status,
                    isMatch = true,
                    message = "It's a match!"
                };
            }

            // Business logic: No mutual like yet, just create pending
            var chatUser = new ChatUser
            {
                FromPetId = request.FromPetId,
                ToPetId = request.ToPetId,
                FromUserId = request.FromUserId,  // ✅ Store user IDs for filtering
                ToUserId = request.ToUserId,      // ✅ Store user IDs for filtering
                Status = "Pending",
                IsDeleted = false,
                CreatedAt = DateTime.Now,
                UpdatedAt = DateTime.Now
            };

            await _chatUserRepository.AddAsync(chatUser, ct);

            // Business logic: Validate user ID consistency after creation
            var createdChatUser = await _context.ChatUsers
                .Include(c => c.FromPet)
                .Include(c => c.ToPet)
                .FirstOrDefaultAsync(c => c.MatchId == chatUser.MatchId, ct);

            if (createdChatUser != null)
            {
                // Verify FromUserId matches FromPet.UserId
                if (createdChatUser.FromPet?.UserId != null && 
                    createdChatUser.FromUserId != createdChatUser.FromPet.UserId)
                {
                    Console.WriteLine($"⚠️ WARNING: User ID mismatch detected in ChatUser {createdChatUser.MatchId}. " +
                                    $"FromUserId={createdChatUser.FromUserId}, FromPet.UserId={createdChatUser.FromPet.UserId}");
                }

                // Verify ToUserId matches ToPet.UserId
                if (createdChatUser.ToPet?.UserId != null && 
                    createdChatUser.ToUserId != createdChatUser.ToPet.UserId)
                {
                    Console.WriteLine($"⚠️ WARNING: User ID mismatch detected in ChatUser {createdChatUser.MatchId}. " +
                                    $"ToUserId={createdChatUser.ToUserId}, ToPet.UserId={createdChatUser.ToPet.UserId}");
                }
            }

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

            // Get UserIds from pets after save
            var savedChatUser = await _context.ChatUsers
                .Include(c => c.FromPet)
                .Include(c => c.ToPet)
                .FirstOrDefaultAsync(c => c.MatchId == chatUser.MatchId, ct);

            return new
            {
                matchId = chatUser.MatchId,
                fromUserId = savedChatUser?.FromPet?.UserId,
                toUserId = savedChatUser?.ToPet?.UserId,
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
                // Business logic: Load pets to get user IDs
                await _context.Entry(chatUser)
                    .Reference(c => c.FromPet)
                    .LoadAsync(ct);
                await _context.Entry(chatUser)
                    .Reference(c => c.ToPet)
                    .LoadAsync(ct);

                if (chatUser.FromPet == null || chatUser.ToPet == null || 
                    chatUser.FromPet.UserId == null || chatUser.ToPet.UserId == null)
                {
                    throw new InvalidOperationException("Không tìm thấy thông tin pet hoặc user.");
                }

                // Business logic: Accept the like - it's a match!
                chatUser.Status = "Accepted";
                chatUser.UpdatedAt = DateTime.Now;
                await _chatUserRepository.UpdateAsync(chatUser, ct);

                // Business logic: Get user names and pets for notifications
                var user1 = await _context.Users.FindAsync(chatUser.FromPet.UserId);
                var user2 = await _context.Users.FindAsync(chatUser.ToPet.UserId);

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
                await CreateMatchNotification(chatUser.FromPet.UserId.Value, chatUser.ToPet.UserId.Value, chatUser.MatchId, ct);

                // Business logic: Send real-time match notifications to both users
                if (user1 != null && user2 != null)
                {
                    await ChatHub.SendMatchNotification(_hubContext, chatUser.FromPet.UserId.Value, user2.FullName, chatUser.ToPet.UserId.Value, chatUser.MatchId, pet2?.Name, pet2Photo);
                    await ChatHub.SendMatchNotification(_hubContext, chatUser.ToPet.UserId.Value, user1.FullName, chatUser.FromPet.UserId.Value, chatUser.MatchId, pet1?.Name, pet1Photo);
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
            // Business logic: Get user's pet IDs
            var userPetIds = await _context.Pets
                .Where(p => p.UserId == userId && p.IsDeleted == false)
                .Select(p => p.PetId)
                .ToListAsync(ct);

            if (!userPetIds.Any())
            {
                return new { unreadChats = new List<int>(), favoriteBadge = 0 };
            }

            var userPetIdSet = userPetIds.ToHashSet();
            var filterSet = petId.HasValue && userPetIdSet.Contains(petId.Value) 
                ? new HashSet<int> { petId.Value } 
                : userPetIdSet;

            // Business logic: Get all accepted matches for this user's pets
            var query = _context.ChatUsers
                .Include(c => c.FromPet)
                .Include(c => c.ToPet)
                .Where(c => c.IsDeleted == false
                           && c.Status == "Accepted"
                           && c.FromPet != null && c.ToPet != null
                           && (filterSet.Contains(c.FromPetId ?? -1) || filterSet.Contains(c.ToPetId ?? -1)));

            var acceptedMatches = await query
                .Select(c => c.MatchId)
                .ToListAsync(ct);

            // Business logic: Get list of matchIds with unread messages (Messenger-style)
            var unreadChats = new List<int>();
            foreach (var matchId in acceptedMatches)
            {
                var lastMessage = await _context.ChatUserContents
                    .Include(c => c.FromPet)
                    .Where(c => c.MatchId == matchId)
                    .OrderByDescending(c => c.CreatedAt)
                    .FirstOrDefaultAsync(ct);

                if (lastMessage != null && lastMessage.FromPet != null && 
                    lastMessage.FromPet.UserId != userId)
                {
                    // Last message is from other user = unread
                    unreadChats.Add(matchId);
                }
            }

            // Business logic: Count pending likes (people who liked you)
            // Use ChatUser.ToUserId directly for filtering (more reliable than navigation properties)
            var pendingLikesQuery = _context.ChatUsers
                .Where(c => c.IsDeleted == false
                           && c.Status == "Pending"
                           && c.ToUserId == userId
                           && filterSet.Contains(c.ToPetId ?? -1));

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

