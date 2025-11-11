using BE.Models;
using BE.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;

namespace BE.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class MatchController : Controller
    {
        private readonly PawnderDatabaseContext _context;
        private readonly IHubContext<ChatHub> _hubContext;
        private readonly DailyLimitService _dailyLimitService;

        public MatchController(
            PawnderDatabaseContext context, 
            IHubContext<ChatHub> hubContext,
            DailyLimitService dailyLimitService)
        {
            _context = context;
            _hubContext = hubContext;
            _dailyLimitService = dailyLimitService;
        }

        /// <summary>
        /// Get likes received with pet information
        /// GET /api/match/likes-received/{userId}?petId={petId}
        /// Optional petId parameter to filter likes for specific pet
        /// </summary>
        [HttpGet("likes-received/{userId}")]
        public async Task<IActionResult> GetLikesReceived(int userId, [FromQuery] int? petId = null)
        {
            try
            {

                
                // Get blocked users (both directions)
                var blockedByMe = await _context.Blocks
                    .Where(b => b.FromUserId == userId)
                    .Select(b => b.ToUserId)
                    .ToListAsync();
                
                var blockedMe = await _context.Blocks
                    .Where(b => b.ToUserId == userId)
                    .Select(b => b.FromUserId)
                    .ToListAsync();
                
                var allBlockedUserIds = blockedByMe.Union(blockedMe).ToList();
                

                
                // Build query for match requests (both pending and accepted) excluding blocked users
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

                // Filter by petId if provided (only show likes where this pet is involved)
                if (petId.HasValue)
                {
                    query = query.Where(c => c.FromPetId == petId.Value || c.ToPetId == petId.Value);
                }

                var allMatchRequests = await query.ToListAsync();
                


                var result = allMatchRequests.Select(c =>
                {
                    // Determine if this is a match (Accepted) or pending like
                    bool isMatch = c.Status == "Accepted";
                    
                    // Get the OTHER user and pet (from match, not active pet)
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

                return Ok(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error fetching likes", error = ex.Message });
            }
        }

        /// <summary>
        /// Get user stats (matches and likes count)
        /// GET /api/match/stats/{userId}
        /// </summary>
        [HttpGet("stats/{userId}")]
        public async Task<IActionResult> GetStats(int userId)
        {
            try
            {

                
                // Count matches (Accepted status where user is involved)
                var matchesCount = await _context.ChatUsers
                    .Where(c => c.IsDeleted == false 
                               && c.Status == "Accepted" 
                               && (c.FromUserId == userId || c.ToUserId == userId))
                    .CountAsync();
                
                // Count likes received (Pending status where user is recipient)
                var likesCount = await _context.ChatUsers
                    .Where(c => c.IsDeleted == false 
                               && c.Status == "Pending" 
                               && c.ToUserId == userId)
                    .CountAsync();
                

                
                return Ok(new
                {
                    matches = matchesCount,
                    likes = likesCount
                });
            }
            catch (Exception ex)
            {

                return StatusCode(500, new { message = "Error fetching stats", error = ex.Message });
            }
        }

        /// <summary>
        /// Send a like (create match request)
        /// POST /api/match/like
        /// Body: { fromUserId, toUserId }
        /// </summary>
        [HttpPost("like")]
        public async Task<IActionResult> SendLike([FromBody] LikeRequest request)
        {
            try
            {
                // 🔒 CHECK DAILY LIMIT (Free: 20, VIP: 100)
                bool canMatch = await _dailyLimitService.CanPerformAction(request.FromUserId, "request_match");
                if (!canMatch)
                {
                    int remaining = await _dailyLimitService.GetRemainingCount(request.FromUserId, "request_match");
                    return StatusCode(429, new 
                    { 
                        message = "Bạn đã hết lượt gửi match hôm nay! Nâng cấp lên VIP để sử dụng không giới hạn.",
                        remaining = remaining,
                        actionType = "request_match"
                    });
                }

                
                if (request.FromUserId == request.ToUserId)
                    return BadRequest(new { message = "Cannot like yourself" });

                // Check if blocked by target user (silent reject)
                var isBlocked = await _context.Blocks
                    .AnyAsync(b => b.FromUserId == request.ToUserId && b.ToUserId == request.FromUserId);
                
                if (isBlocked)
                {

                    // Return success but don't create anything (user doesn't know they're blocked)
                    return Ok(new
                    {
                        matchId = 0,
                        fromUserId = request.FromUserId,
                        toUserId = request.ToUserId,
                        status = "Rejected",
                        isMatch = false,
                        message = "Request processed"
                    });
                }

                // Check if already exists (sent by current user with SAME pet pair)
                var existingLike = await _context.ChatUsers
                    .FirstOrDefaultAsync(c => c.FromUserId == request.FromUserId 
                                            && c.ToUserId == request.ToUserId 
                                            && c.FromPetId == request.FromPetId
                                            && c.ToPetId == request.ToPetId
                                            && c.IsDeleted == false);

                if (existingLike != null)
                {

                    return BadRequest(new { message = "Already liked this pet" });
                }

                // Check if the other user already liked us (mutual like with REVERSED pet pair)
                // Pet A likes Pet B, check if Pet B already liked Pet A
                var reciprocalLike = await _context.ChatUsers
                    .FirstOrDefaultAsync(c => c.FromUserId == request.ToUserId 
                                            && c.ToUserId == request.FromUserId 
                                            && c.FromPetId == request.ToPetId // Their from pet = our to pet
                                            && c.ToPetId == request.FromPetId // Their to pet = our from pet
                                            && c.IsDeleted == false);

                if (reciprocalLike != null)
                {

                    // It's a match! Update to Accepted
                    reciprocalLike.Status = "Accepted";
                    reciprocalLike.UpdatedAt = DateTime.Now;
                    _context.ChatUsers.Update(reciprocalLike);
                    await _context.SaveChangesAsync();

                    // 📝 RECORD ACTION TO DAILY LIMIT (mutual match)
                    await _dailyLimitService.RecordAction(request.FromUserId, "request_match");
                    int remaining = await _dailyLimitService.GetRemainingCount(request.FromUserId, "request_match");
                    Console.WriteLine($"✅ Mutual match recorded. User {request.FromUserId} has {remaining} matches remaining today.");

                    // Get user names and pets for notifications
                    var user1 = await _context.Users.FindAsync(request.FromUserId);
                    var user2 = await _context.Users.FindAsync(request.ToUserId);
                    
                    // Get pets involved in this match (use FromPetId and ToPetId) with photos
                    var pet1 = await _context.Pets
                        .Include(p => p.PetPhotos.Where(pp => pp.IsDeleted == false))
                        .Where(p => p.PetId == request.FromPetId && p.IsDeleted == false)
                        .FirstOrDefaultAsync();
                    var pet2 = await _context.Pets
                        .Include(p => p.PetPhotos.Where(pp => pp.IsDeleted == false))
                        .Where(p => p.PetId == request.ToPetId && p.IsDeleted == false)
                        .FirstOrDefaultAsync();
                    

                    
                    var pet1Photo = pet1?.PetPhotos
                        ?.OrderBy(pp => pp.SortOrder)
                        .ThenBy(pp => pp.PhotoId)
                        .Select(pp => pp.ImageUrl)
                        .FirstOrDefault();
                    var pet2Photo = pet2?.PetPhotos
                        ?.OrderBy(pp => pp.SortOrder)
                        .ThenBy(pp => pp.PhotoId)
                        .Select(pp => pp.ImageUrl)
                        .FirstOrDefault();
                    


                    // Create notification for both users (they can view in Notification screen)
                    await CreateMatchNotification(request.FromUserId, request.ToUserId, reciprocalLike.MatchId);

                    // Send real-time match notifications to both users
                    if (user1 != null && user2 != null)
                    {

                        await ChatHub.SendMatchNotification(_hubContext, request.FromUserId, user2.FullName, request.ToUserId, reciprocalLike.MatchId, pet2?.Name, pet2Photo);
                        

                        await ChatHub.SendMatchNotification(_hubContext, request.ToUserId, user1.FullName, request.FromUserId, reciprocalLike.MatchId, pet1?.Name, pet1Photo);
                    }

                    return Ok(new
                    {
                        matchId = reciprocalLike.MatchId,
                        fromUserId = reciprocalLike.FromUserId,
                        toUserId = reciprocalLike.ToUserId,
                        status = reciprocalLike.Status,
                        isMatch = true,
                        message = "It's a match!"
                    });
                }

                // No mutual like yet, just create pending

                var chatUser = new ChatUser
                {
                    FromUserId = request.FromUserId,
                    ToUserId = request.ToUserId,
                    FromPetId = request.FromPetId, // Track which pet sent the like
                    ToPetId = request.ToPetId, // Track which pet received the like
                    Status = "Pending",
                    IsDeleted = false,
                    CreatedAt = DateTime.Now,
                    UpdatedAt = DateTime.Now
                };

                _context.ChatUsers.Add(chatUser);
                await _context.SaveChangesAsync();
                
                // 📝 RECORD ACTION TO DAILY LIMIT
                bool recorded = await _dailyLimitService.RecordAction(request.FromUserId, "request_match");
                if (recorded)
                {
                    int remaining = await _dailyLimitService.GetRemainingCount(request.FromUserId, "request_match");
                    Console.WriteLine($"✅ Match recorded. User {request.FromUserId} has {remaining} matches remaining today.");
                }


                // Send real-time badge notification to recipient
                await SendLikeNotification(request.ToUserId, request.FromUserId);

                // Get remaining count for response
                int remainingMatches = await _dailyLimitService.GetRemainingCount(request.FromUserId, "request_match");

                return Ok(new
                {
                    matchId = chatUser.MatchId,
                    fromUserId = chatUser.FromUserId,
                    toUserId = chatUser.ToUserId,
                    status = chatUser.Status,
                    isMatch = false,
                    message = "Like sent",
                    remainingMatches = remainingMatches // Trả về số lượt còn lại
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error sending like", error = ex.Message });
            }
        }

        /// <summary>
        /// Respond to a like (accept = match, or reject = pass)
        /// PUT /api/match/respond
        /// Body: { matchId, action } where action = "match" or "pass"
        /// </summary>
        [HttpPut("respond")]
        public async Task<IActionResult> RespondToLike([FromBody] RespondRequest request)
        {
            try
            {

                
                // For "pass" action, allow both Pending and Accepted status (for unmatch)
                var chatUser = request.Action.ToLower() == "pass"
                    ? await _context.ChatUsers.FirstOrDefaultAsync(c => c.MatchId == request.MatchId && c.IsDeleted == false)
                    : await _context.ChatUsers.FirstOrDefaultAsync(c => c.MatchId == request.MatchId && c.Status == "Pending");

                if (chatUser == null)
                {

                    return NotFound(new { message = "Like request not found" });
                }



                if (request.Action.ToLower() == "match")
                {
                    // Accept the like - it's a match!
                    chatUser.Status = "Accepted";
                    chatUser.UpdatedAt = DateTime.Now;
                    _context.ChatUsers.Update(chatUser);
                    await _context.SaveChangesAsync();

                    // Get user names and pets for notifications
                    var user1 = await _context.Users.FindAsync(chatUser.FromUserId);
                    var user2 = await _context.Users.FindAsync(chatUser.ToUserId);
                    
                    // Get pets involved in this match (use FromPetId and ToPetId from ChatUser) with photos
                    var pet1 = await _context.Pets
                        .Include(p => p.PetPhotos.Where(pp => pp.IsDeleted == false))
                        .Where(p => p.PetId == chatUser.FromPetId && p.IsDeleted == false)
                        .FirstOrDefaultAsync();
                    var pet2 = await _context.Pets
                        .Include(p => p.PetPhotos.Where(pp => pp.IsDeleted == false))
                        .Where(p => p.PetId == chatUser.ToPetId && p.IsDeleted == false)
                        .FirstOrDefaultAsync();
                    

                    
                    var pet1Photo = pet1?.PetPhotos
                        ?.OrderBy(pp => pp.SortOrder)
                        .ThenBy(pp => pp.PhotoId)
                        .Select(pp => pp.ImageUrl)
                        .FirstOrDefault();
                    var pet2Photo = pet2?.PetPhotos
                        ?.OrderBy(pp => pp.SortOrder)
                        .ThenBy(pp => pp.PhotoId)
                        .Select(pp => pp.ImageUrl)
                        .FirstOrDefault();
                    


                    // Create notification (users can view in Notification screen)
                    await CreateMatchNotification(chatUser.FromUserId!.Value, chatUser.ToUserId!.Value, chatUser.MatchId);

                    // Send real-time match notifications to both users
                    if (user1 != null && user2 != null)
                    {

                        await ChatHub.SendMatchNotification(_hubContext, chatUser.FromUserId.Value, user2.FullName, chatUser.ToUserId.Value, chatUser.MatchId, pet2?.Name, pet2Photo);
                        

                        await ChatHub.SendMatchNotification(_hubContext, chatUser.ToUserId.Value, user1.FullName, chatUser.FromUserId.Value, chatUser.MatchId, pet1?.Name, pet1Photo);
                    }



                    return Ok(new
                    {
                        matchId = chatUser.MatchId,
                        status = chatUser.Status,
                        isMatch = true,
                        message = "It's a match!"
                    });
                }
                else if (request.Action.ToLower() == "pass")
                {
                    // Reject/Unmatch - soft delete to keep data for review

                    
                    // Soft delete the ChatUser entry (keeps messages in DB)
                    chatUser.IsDeleted = true;
                    chatUser.UpdatedAt = DateTime.SpecifyKind(DateTime.UtcNow, DateTimeKind.Unspecified);
                    
                    await _context.SaveChangesAsync();

                    // DO NOT notify the other user when unmatched
                    // In dating apps, unmatch should be silent - the other person should not know


                    return Ok(new { message = chatUser.Status == "Accepted" ? "Unmatched" : "Passed" });
                }
                else
                {
                    return BadRequest(new { message = "Invalid action. Use 'match' or 'pass'" });
                }
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error responding to like", error = ex.Message });
            }
        }

        /// <summary>
        /// Get badge counts for user (unread messages + pending likes)
        /// GET /api/match/badge-counts/{userId}
        /// </summary>
        [HttpGet("badge-counts/{userId}")]
        public async Task<IActionResult> GetBadgeCounts(int userId)
        {
            try
            {


                // Get all accepted matches for this user
                var acceptedMatches = await _context.ChatUsers
                    .Where(c => c.IsDeleted == false 
                               && c.Status == "Accepted" 
                               && (c.FromUserId == userId || c.ToUserId == userId))
                    .Select(c => c.MatchId)
                    .ToListAsync();

                // Get list of matchIds with unread messages (Messenger-style)
                // A chat is "unread" if the last message is from the other user
                var unreadChats = new List<int>();
                foreach (var matchId in acceptedMatches)
                {
                    var lastMessage = await _context.ChatUserContents
                        .Where(c => c.MatchId == matchId)
                        .OrderByDescending(c => c.CreatedAt)
                        .FirstOrDefaultAsync();

                    if (lastMessage != null && lastMessage.FromUserId != userId)
                    {
                        // Last message is from other user = unread
                        unreadChats.Add(matchId);
                    }
                }

                // Count pending likes (people who liked you)
                var pendingLikesCount = await _context.ChatUsers
                    .Where(c => c.IsDeleted == false 
                               && c.Status == "Pending" 
                               && c.ToUserId == userId)
                    .CountAsync();



                return Ok(new
                {
                    unreadChats = unreadChats, // Return list of matchIds
                    favoriteBadge = pendingLikesCount
                });
            }
            catch (Exception ex)
            {

                return StatusCode(500, new { message = "Error fetching badge counts", error = ex.Message });
            }
        }

        /// <summary>
        /// Helper method to create match notifications for both users
        /// </summary>
        private async Task CreateMatchNotification(int userId1, int userId2, int matchId)
        {
            try
            {
                var user1 = await _context.Users.FindAsync(userId1);
                var user2 = await _context.Users.FindAsync(userId2);

                if (user1 != null && user2 != null)
                {
                    // Notification for user 1
                    var notification1 = new Notification
                    {
                        UserId = userId1,
                        Title = "New Match! 🎉",
                        Message = $"You matched with {user2.FullName}! Start chatting now.",
                        CreatedAt = DateTime.Now
                    };

                    // Notification for user 2
                    var notification2 = new Notification
                    {
                        UserId = userId2,
                        Title = "New Match! 🎉",
                        Message = $"You matched with {user1.FullName}! Start chatting now.",
                        CreatedAt = DateTime.Now
                    };

                    _context.Notifications.Add(notification1);
                    _context.Notifications.Add(notification2);
                    await _context.SaveChangesAsync();
                }
            }
            catch (Exception ex)
            {

                // Don't throw - notifications are not critical
            }
        }

        /// <summary>
        /// Send real-time like notification via SignalR
        /// </summary>
        private async Task SendLikeNotification(int toUserId, int fromUserId)
        {
            try
            {
                await ChatHub.SendNewLikeBadge(_hubContext, toUserId, fromUserId);
            }
            catch (Exception ex)
            {

            }
        }
    }

    // Request DTOs
    public class LikeRequest
    {
        public int FromUserId { get; set; }
        public int ToUserId { get; set; }
        public int FromPetId { get; set; } // Pet that is sending the like
        public int ToPetId { get; set; } // Pet that is receiving the like
    }

    public class RespondRequest
    {
        public int MatchId { get; set; }
        public string Action { get; set; } = null!; // "match" or "pass"
    }
}

