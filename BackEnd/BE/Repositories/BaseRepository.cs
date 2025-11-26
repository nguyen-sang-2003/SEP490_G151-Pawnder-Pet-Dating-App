using BE.Models;
using BE.Repositories.Interfaces;
using Microsoft.EntityFrameworkCore;
using System.Linq.Expressions;

namespace BE.Repositories
{
    /// <summary>
    /// Base repository implementation với các method CRUD cơ bản
    /// </summary>
    public class BaseRepository<T> : IBaseRepository<T> where T : class
    {
        protected readonly PawnderDatabaseContext _context;
        protected readonly DbSet<T> _dbSet;

        public BaseRepository(PawnderDatabaseContext context)
        {
            _context = context;
            _dbSet = context.Set<T>();
        }

        public virtual async Task<T?> GetByIdAsync(int id, CancellationToken ct = default)
        {
            return await _dbSet.FindAsync(new object[] { id }, ct);
        }

        public virtual async Task<IEnumerable<T>> GetAllAsync(CancellationToken ct = default)
        {
            return await _dbSet.ToListAsync(ct);
        }

        public virtual async Task<IEnumerable<T>> FindAsync(Expression<Func<T, bool>> predicate, CancellationToken ct = default)
        {
            return await _dbSet.Where(predicate).ToListAsync(ct);
        }

        public virtual async Task<T?> FirstOrDefaultAsync(Expression<Func<T, bool>> predicate, CancellationToken ct = default)
        {
            return await _dbSet.FirstOrDefaultAsync(predicate, ct);
        }

        public virtual async Task<T> AddAsync(T entity, CancellationToken ct = default)
        {
            await _dbSet.AddAsync(entity, ct);
            await _context.SaveChangesAsync(ct);
            return entity;
        }

        public virtual async Task AddRangeAsync(IEnumerable<T> entities, CancellationToken ct = default)
        {
            await _dbSet.AddRangeAsync(entities, ct);
            await _context.SaveChangesAsync(ct);
        }

        public virtual async Task UpdateAsync(T entity, CancellationToken ct = default)
        {
            _dbSet.Update(entity);
            await _context.SaveChangesAsync(ct);
        }

        public virtual async Task UpdateRangeAsync(IEnumerable<T> entities, CancellationToken ct = default)
        {
            _dbSet.UpdateRange(entities);
            await _context.SaveChangesAsync(ct);
        }

        public virtual async Task DeleteAsync(T entity, CancellationToken ct = default)
        {
            _dbSet.Remove(entity);
            await _context.SaveChangesAsync(ct);
        }

        public virtual async Task DeleteRangeAsync(IEnumerable<T> entities, CancellationToken ct = default)
        {
            _dbSet.RemoveRange(entities);
            await _context.SaveChangesAsync(ct);
        }

        public virtual async Task<bool> ExistsAsync(Expression<Func<T, bool>> predicate, CancellationToken ct = default)
        {
            return await _dbSet.AnyAsync(predicate, ct);
        }

        public virtual async Task<int> CountAsync(Expression<Func<T, bool>>? predicate = null, CancellationToken ct = default)
        {
            if (predicate == null)
                return await _dbSet.CountAsync(ct);
            
            return await _dbSet.CountAsync(predicate, ct);
        }

        public virtual async Task SaveChangesAsync(CancellationToken ct = default)
        {
            await _context.SaveChangesAsync(ct);
        }
    }
}

