using BE.DTO;
using BE.Models;
using BE.Repositories.Interfaces;
using BE.Services.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace BE.Services
{
    public class AttributeOptionService : IAttributeOptionService
    {
        private readonly IAttributeOptionRepository _optionRepository;
        private readonly PawnderDatabaseContext _context;

        public AttributeOptionService(
            IAttributeOptionRepository optionRepository,
            PawnderDatabaseContext context)
        {
            _optionRepository = optionRepository;
            _context = context;
        }

        public async Task<IEnumerable<OptionResponse>> GetAllOptionsAsync(CancellationToken ct = default)
        {
            return await _optionRepository.GetAllOptionsAsync(ct);
        }

        public async Task<IEnumerable<object>> GetOptionsByAttributeIdAsync(int attributeId, CancellationToken ct = default)
        {
            // Business logic: Validate attribute
            var attribute = await _context.Attributes.FindAsync([attributeId], ct);
            if (attribute == null || attribute.IsDeleted != false)
                throw new KeyNotFoundException("Không tìm thấy attribute tương ứng.");

            return await _optionRepository.GetOptionsByAttributeIdAsync(attributeId, ct);
        }

        public async Task<object> CreateOptionAsync(int attributeId, string optionName, CancellationToken ct = default)
        {
            if (string.IsNullOrWhiteSpace(optionName))
                throw new ArgumentException("Tên option không được để trống.");

            // Business logic: Validate attribute
            var attribute = await _context.Attributes.FindAsync([attributeId], ct);
            if (attribute == null || attribute.IsDeleted != false)
                throw new KeyNotFoundException("Không tìm thấy attribute tương ứng.");

            var newOption = new AttributeOption
            {
                AttributeId = attributeId,
                Name = optionName.Trim(),
                IsDeleted = false,
                CreatedAt = DateTime.Now,
                UpdatedAt = DateTime.Now
            };

            await _optionRepository.AddAsync(newOption, ct);

            return new { message = "Tạo option thành công." };
        }

        public async Task<bool> UpdateOptionAsync(int optionId, string optionName, CancellationToken ct = default)
        {
            if (string.IsNullOrWhiteSpace(optionName))
                throw new ArgumentException("Option không được để trống.");

            var exitOption = await _optionRepository.GetByIdAsync(optionId, ct);
            if (exitOption == null || exitOption.IsDeleted != false)
                throw new KeyNotFoundException("Không tìm thấy option tương ứng.");

            exitOption.Name = optionName.Trim();
            exitOption.UpdatedAt = DateTime.Now;

            await _optionRepository.UpdateAsync(exitOption, ct);
            return true;
        }

        public async Task<bool> DeleteOptionAsync(int optionId, CancellationToken ct = default)
        {
            var option = await _optionRepository.GetByIdAsync(optionId, ct);
            if (option == null || option.IsDeleted != false)
                return false;

            option.IsDeleted = true;
            option.UpdatedAt = DateTime.Now;

            await _optionRepository.UpdateAsync(option, ct);
            return true;
        }
    }
}




