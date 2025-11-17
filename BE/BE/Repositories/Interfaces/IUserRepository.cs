using BE.DTO;
using BE.Models;

namespace BE.Repositories.Interfaces
{
    public interface IUserRepository : IBaseRepository<User>
    {
        Task<PagedResult<UserResponse>> GetUsersAsync(
            string? search,
            int? roleId,
            int? statusId,
            int page,
            int pageSize,
            bool includeDeleted,
            CancellationToken ct = default);
        
        Task<User?> GetUserByIdAsync(int userId, bool includeDeleted = false, CancellationToken ct = default);
        Task<bool> EmailExistsAsync(string email, CancellationToken ct = default);
        Task<User?> GetUserByEmailAsync(string email, CancellationToken ct = default);
    }
}




