using BE.DTO;
using BE.Models;
using BE.Repositories.Interfaces;
using BE.Services.Interfaces;
using AttributeEntity = BE.Models.Attribute;

namespace BE.Services
{
    public class AttributeService : IAttributeService
    {
        private readonly IAttributeRepository _attributeRepository;

        public AttributeService(IAttributeRepository attributeRepository)
        {
            _attributeRepository = attributeRepository;
        }

        public async Task<PagedResult<AttributeResponse>> GetAttributesAsync(
            string? search,
            int page,
            int pageSize,
            bool includeDeleted,
            CancellationToken ct = default)
        {
            if (page <= 0 || pageSize <= 0)
                throw new ArgumentException("Tham số phân trang không hợp lệ.");

            return await _attributeRepository.GetAttributesAsync(search, page, pageSize, includeDeleted, ct);
        }

        public async Task<AttributeResponse?> GetAttributeByIdAsync(int id, CancellationToken ct = default)
        {
            var entity = await _attributeRepository.GetAttributeByIdAsync(id, ct);
            if (entity == null)
                return null;

            return new AttributeResponse
            {
                AttributeId = entity.AttributeId,
                Name = entity.Name,
                TypeValue = entity.TypeValue,
                Unit = entity.Unit,
                IsDeleted = entity.IsDeleted,
                CreatedAt = entity.CreatedAt,
                UpdatedAt = entity.UpdatedAt
            };
        }

        public async Task<AttributeResponse> CreateAttributeAsync(AttributeCreateRequest request, CancellationToken ct = default)
        {
            // Business logic: Check duplicate name
            var exists = await _attributeRepository.NameExistsAsync(request.Name, null, ct);
            if (exists)
                throw new InvalidOperationException("Tên thuộc tính đã tồn tại.");

            var now = DateTime.Now;
            var entity = new AttributeEntity
            {
                Name = request.Name.Trim(),
                TypeValue = request.TypeValue?.Trim(),
                Unit = request.Unit?.Trim(),
                IsDeleted = request.IsDeleted,
                CreatedAt = now,
                UpdatedAt = now
            };

            await _attributeRepository.AddAsync(entity, ct);

            return new AttributeResponse
            {
                AttributeId = entity.AttributeId,
                Name = entity.Name,
                TypeValue = entity.TypeValue,
                Unit = entity.Unit,
                IsDeleted = entity.IsDeleted,
                CreatedAt = entity.CreatedAt,
                UpdatedAt = entity.UpdatedAt
            };
        }

        public async Task<bool> UpdateAttributeAsync(int id, AttributeUpdateRequest request, CancellationToken ct = default)
        {
            var entity = await _attributeRepository.GetByIdAsync(id, ct);
            if (entity == null)
                throw new KeyNotFoundException("Không tìm thấy thuộc tính để cập nhật.");

            // Business logic: Check duplicate name
            var duplicate = await _attributeRepository.NameExistsAsync(request.Name, id, ct);
            if (duplicate)
                throw new InvalidOperationException("Tên thuộc tính đã tồn tại.");

            entity.Name = request.Name.Trim();
            entity.TypeValue = request.TypeValue?.Trim();
            entity.Unit = request.Unit?.Trim();
            if (request.IsDeleted.HasValue) entity.IsDeleted = request.IsDeleted.Value;
            entity.UpdatedAt = DateTime.Now;

            await _attributeRepository.UpdateAsync(entity, ct);
            return true;
        }

        public async Task<bool> DeleteAttributeAsync(int id, bool hard = false, CancellationToken ct = default)
        {
            var entity = await _attributeRepository.GetByIdAsync(id, ct);
            if (entity == null)
                throw new KeyNotFoundException("Không tìm thấy thuộc tính để xoá.");

            if (hard)
            {
                await _attributeRepository.DeleteAsync(entity, ct);
            }
            else
            {
                if (entity.IsDeleted == true)
                    throw new InvalidOperationException("Thuộc tính đã ở trạng thái xoá mềm.");
                
                entity.IsDeleted = true;
                entity.UpdatedAt = DateTime.Now;
                await _attributeRepository.UpdateAsync(entity, ct);
            }

            return true;
        }

        public async Task<object> GetAttributesForFilterAsync(CancellationToken ct = default)
        {
            var attributes = await _attributeRepository.GetAttributesForFilterAsync(ct);

            // Business logic: Calculate statistics
            var totalPercent = attributes
                .Cast<dynamic>()
                .Where(a => a.Percent != null && a.Percent > 0)
                .Sum(a => (decimal?)(a.Percent ?? 0) ?? 0);

            var topAttributes = attributes
                .Cast<dynamic>()
                .Where(a => a.Percent != null && a.Percent > 0)
                .OrderByDescending(a => (decimal?)(a.Percent ?? 0))
                .Take(3)
                .Select(a => (string)a.Name)
                .ToList();

            return new
            {
                message = "Lấy danh sách thuộc tính để filter thành công.",
                data = attributes,
                suggestion = new
                {
                    topAttributes = topAttributes,
                    totalPercent = Math.Round(totalPercent, 1),
                    message = topAttributes.Count > 0
                        ? $"Chọn filter theo {string.Join(", ", topAttributes.Take(2))} để tìm match phù hợp hơn!"
                        : null
                }
            };
        }
    }
}

