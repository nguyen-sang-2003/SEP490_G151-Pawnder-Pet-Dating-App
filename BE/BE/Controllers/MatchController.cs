using BE.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace BE.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class MatchController : Controller
    {
        private readonly PawnderDatabaseContext _context;

        public MatchController(PawnderDatabaseContext context)
        {
            _context = context;
        }

        /// <summary>
        /// Get likes received with pet information
        /// GET /api/match/likes-received/{userId}
        /// </summary>
        [HttpGet("likes-received/{userId}")]
        public async Task<IActionResult> GetLikesReceived(int userId)
        {
            try
            {
                Console.WriteLine($"[MatchController] Getting likes for userId: {userId}");
                
                // Get all match requests (both pending and accepted)
                var allMatchRequests = await _context.ChatUsers
                    .Include(c => c.FromUser)
                        .ThenInclude(u => u!.Address)
                    .Include(c => c.FromUser)
                        .ThenInclude(u => u!.Pets.Where(p => p.IsActive == true && p.IsDeleted == false))
                            .ThenInclude(p => p.PetPhotos)
                    .Include(c => c.ToUser)
                        .ThenInclude(u => u!.Address)
                    .Include(c => c.ToUser)
                        .ThenInclude(u => u!.Pets.Where(p => p.IsActive == true && p.IsDeleted == false))
                            .ThenInclude(p => p.PetPhotos)
                    .Where(c => c.IsDeleted == false && 
                               (
                                   (c.ToUserId == userId && c.Status == "Pending") || 
                                   ((c.FromUserId == userId || c.ToUserId == userId) && c.Status == "Accepted")
                               ))
                    .ToListAsync();
                
                Console.WriteLine($"[MatchController] Found {allMatchRequests.Count} match requests");

                var result = allMatchRequests.Select(c =>
                {
                    // Determine if this is a match (Accepted) or pending like
                    bool isMatch = c.Status == "Accepted";
                    
                    // Get the OTHER user (not current user)
                    var otherUser = c.ToUserId == userId ? c.FromUser : c.ToUser;
                    var otherUserPet = otherUser?.Pets?.FirstOrDefault(p => p.IsActive == true && p.IsDeleted == false);

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
        /// Send a like (create match request)
        /// POST /api/match/like
        /// Body: { fromUserId, toUserId }
        /// </summary>
        [HttpPost("like")]
        public async Task<IActionResult> SendLike([FromBody] LikeRequest request)
        {
            try
            {
                Console.WriteLine($"[MatchController] SendLike: fromUserId={request.FromUserId}, toUserId={request.ToUserId}");
                
                if (request.FromUserId == request.ToUserId)
                    return BadRequest(new { message = "Cannot like yourself" });

                // Check if already exists (sent by current user)
                var existingLike = await _context.ChatUsers
                    .FirstOrDefaultAsync(c => c.FromUserId == request.FromUserId 
                                            && c.ToUserId == request.ToUserId 
                                            && c.IsDeleted == false);

                if (existingLike != null)
                {
                    Console.WriteLine($"[MatchController] Already liked this user");
                    return BadRequest(new { message = "Already liked this user" });
                }

                // Check if the other user already liked us (mutual like)
                var reciprocalLike = await _context.ChatUsers
                    .FirstOrDefaultAsync(c => c.FromUserId == request.ToUserId 
                                            && c.ToUserId == request.FromUserId 
                                            && c.IsDeleted == false);

                if (reciprocalLike != null)
                {
                    Console.WriteLine($"[MatchController] Mutual like detected! Updating to Accepted");
                    // It's a match! Update to Accepted
                    reciprocalLike.Status = "Accepted";
                    reciprocalLike.UpdatedAt = DateTime.Now;
                    _context.ChatUsers.Update(reciprocalLike);
                    await _context.SaveChangesAsync();

                    // Create notification for both users
                    await CreateMatchNotification(request.FromUserId, request.ToUserId, reciprocalLike.MatchId);

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
                Console.WriteLine($"[MatchController] Creating new pending ChatUser");
                var chatUser = new ChatUser
                {
                    FromUserId = request.FromUserId,
                    ToUserId = request.ToUserId,
                    Status = "Pending",
                    IsDeleted = false,
                    CreatedAt = DateTime.Now,
                    UpdatedAt = DateTime.Now
                };

                _context.ChatUsers.Add(chatUser);
                await _context.SaveChangesAsync();
                
                Console.WriteLine($"[MatchController] Created ChatUser with MatchId={chatUser.MatchId}");

                return Ok(new
                {
                    matchId = chatUser.MatchId,
                    fromUserId = chatUser.FromUserId,
                    toUserId = chatUser.ToUserId,
                    status = chatUser.Status,
                    isMatch = false,
                    message = "Like sent"
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
                Console.WriteLine($"[MatchController] Responding to like: matchId={request.MatchId}, action={request.Action}");
                
                // For "pass" action, allow both Pending and Accepted status (for unmatch)
                var chatUser = request.Action.ToLower() == "pass"
                    ? await _context.ChatUsers.FirstOrDefaultAsync(c => c.MatchId == request.MatchId && c.IsDeleted == false)
                    : await _context.ChatUsers.FirstOrDefaultAsync(c => c.MatchId == request.MatchId && c.Status == "Pending");

                if (chatUser == null)
                {
                    Console.WriteLine($"[MatchController] ChatUser not found for matchId={request.MatchId}");
                    return NotFound(new { message = "Like request not found" });
                }

                Console.WriteLine($"[MatchController] Found ChatUser: Status={chatUser.Status}, FromUserId={chatUser.FromUserId}, ToUserId={chatUser.ToUserId}");

                if (request.Action.ToLower() == "match")
                {
                    // Accept the like - it's a match!
                    chatUser.Status = "Accepted";
                    chatUser.UpdatedAt = DateTime.Now;
                    _context.ChatUsers.Update(chatUser);
                    await _context.SaveChangesAsync();

                    // Create notification
                    await CreateMatchNotification(chatUser.FromUserId!.Value, chatUser.ToUserId!.Value, chatUser.MatchId);

                    Console.WriteLine($"[MatchController] Match accepted!");

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
                    // Reject/Unmatch - delete the request completely
                    // This allows the pet to appear again in Home screen
                    Console.WriteLine($"[MatchController] Passing/Unmatching - removing ChatUser entry (Status={chatUser.Status})");
                    _context.ChatUsers.Remove(chatUser);
                    await _context.SaveChangesAsync();

                    Console.WriteLine($"[MatchController] ChatUser removed successfully");
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
                Console.WriteLine($"Error creating notifications: {ex.Message}");
                // Don't throw - notifications are not critical
            }
        }
    }

    // Request DTOs
    public class LikeRequest
    {
        public int FromUserId { get; set; }
        public int ToUserId { get; set; }
    }

    public class RespondRequest
    {
        public int MatchId { get; set; }
        public string Action { get; set; } = null!; // "match" or "pass"
    }
}

