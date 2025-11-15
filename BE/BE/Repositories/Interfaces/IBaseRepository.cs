using System.Linq.Expressions;

namespace BE.Repositories.Interfaces
{
    /// <summary>
    /// Base repository interface với các method CRUD cơ bản
    /// </summary>
    public interface IBaseRepository<T> where T : class
    {
        Task<T?> GetByIdAsync(int id, CancellationToken ct = default);
        Task<IEnumerable<T>> GetAllAsync(CancellationToken ct = default);
        Task<IEnumerable<T>> FindAsync(Expression<Func<T, bool>> predicate, CancellationToken ct = default);
        Task<T?> FirstOrDefaultAsync(Expression<Func<T, bool>> predicate, CancellationToken ct = default);
        Task<T> AddAsync(T entity, CancellationToken ct = default);
        Task AddRangeAsync(IEnumerable<T> entities, CancellationToken ct = default);
        Task UpdateAsync(T entity, CancellationToken ct = default);
        Task UpdateRangeAsync(IEnumerable<T> entities, CancellationToken ct = default);
        Task DeleteAsync(T entity, CancellationToken ct = default);
        Task DeleteRangeAsync(IEnumerable<T> entities, CancellationToken ct = default);
        Task<bool> ExistsAsync(Expression<Func<T, bool>> predicate, CancellationToken ct = default);
        Task<int> CountAsync(Expression<Func<T, bool>>? predicate = null, CancellationToken ct = default);
        Task SaveChangesAsync(CancellationToken ct = default);
    }
}

