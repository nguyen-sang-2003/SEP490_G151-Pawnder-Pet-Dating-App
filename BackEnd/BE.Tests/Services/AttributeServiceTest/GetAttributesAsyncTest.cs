using BE.DTO;
using BE.Models;
using BE.Repositories.Interfaces;
using BE.Services;
using Moq;
using Xunit;
using AttributeEntity = BE.Models.Attribute;

namespace BE.Tests.Services.AttributeServiceTest
{
    public class GetAttributesAsyncTest
    {
        private readonly Mock<IAttributeRepository> _mockAttributeRepository;
        private readonly AttributeService? _attributeService;

        public GetAttributesAsyncTest()
        {
            _mockAttributeRepository = new Mock<IAttributeRepository>();
            _attributeService = new AttributeService(_mockAttributeRepository.Object);
        }

        /// <summary>
        /// UTCID01: GetAttributesAsync with valid page=1, pageSize=10, search=empty, includeDeleted=false
        /// Expected: Returns PagedResult with valid properties
        /// </summary>
        [Fact]
        public async Task UTCID01_GetAttributesAsync_ValidPageSizeNoSearchNotIncludedDeleted_ReturnsPagedResult()
        {
            // Arrange
            const int page = 1;
            const int pageSize = 10;
            string? search = null;
            const bool includeDeleted = false;

            var attributes = new List<AttributeResponse>
            {
                new AttributeResponse
                {
                    AttributeId = 1,
                    Name = "Color",
                    TypeValue = "String",
                    Unit = null,
                    IsDeleted = null,
                    CreatedAt = DateTime.Now,
                    UpdatedAt = DateTime.Now
                }
            };

            var pagedResult = new PagedResult<AttributeResponse>(attributes, 1, page, pageSize);

            _mockAttributeRepository
                .Setup(r => r.GetAttributesAsync(search, page, pageSize, includeDeleted, It.IsAny<CancellationToken>()))
                .ReturnsAsync(pagedResult);

            // Act
            var result = await _attributeService!.GetAttributesAsync(search, page, pageSize, includeDeleted);

            // Assert
            Assert.NotNull(result);
            Assert.NotNull(result.Items);
            Assert.Equal(1, result.Total);
            Assert.Equal(page, result.Page);
            Assert.Equal(pageSize, result.PageSize);
            Assert.Single(result.Items);
        }

        /// <summary>
        /// UTCID02: GetAttributesAsync with search parameter provided
        /// Expected: Returns PagedResult with search results
        /// </summary>
        [Fact]
        public async Task UTCID02_GetAttributesAsync_WithSearchTerm_ReturnsFilteredPagedResult()
        {
            // Arrange
            const int page = 1;
            const int pageSize = 10;
            const string search = "Color";
            const bool includeDeleted = false;

            var attributes = new List<AttributeResponse>
            {
                new AttributeResponse
                {
                    AttributeId = 1,
                    Name = "Color",
                    TypeValue = "String",
                    Unit = null,
                    IsDeleted = null,
                    CreatedAt = DateTime.Now,
                    UpdatedAt = DateTime.Now
                }
            };

            var pagedResult = new PagedResult<AttributeResponse>(attributes, 1, page, pageSize);

            _mockAttributeRepository
                .Setup(r => r.GetAttributesAsync(search, page, pageSize, includeDeleted, It.IsAny<CancellationToken>()))
                .ReturnsAsync(pagedResult);

            // Act
            var result = await _attributeService!.GetAttributesAsync(search, page, pageSize, includeDeleted);

            // Assert
            Assert.NotNull(result);
            Assert.NotNull(result.Items);
            Assert.Equal(1, result.Total);
            Assert.Single(result.Items);
            Assert.Equal("Color", result.Items.First().Name);
        }

        /// <summary>
        /// UTCID03: GetAttributesAsync with includeDeleted=true
        /// Expected: Returns PagedResult including deleted items
        /// </summary>
        [Fact]
        public async Task UTCID03_GetAttributesAsync_IncludeDeleted_ReturnsPagedResultWithDeletedItems()
        {
            // Arrange
            const int page = 1;
            const int pageSize = 10;
            string? search = null;
            const bool includeDeleted = true;

            var attributes = new List<AttributeResponse>
            {
                new AttributeResponse
                {
                    AttributeId = 1,
                    Name = "Color",
                    TypeValue = "String",
                    Unit = null,
                    IsDeleted = null,
                    CreatedAt = DateTime.Now,
                    UpdatedAt = DateTime.Now
                },
                new AttributeResponse
                {
                    AttributeId = 2,
                    Name = "Size",
                    TypeValue = "String",
                    Unit = "cm",
                    IsDeleted = true,
                    CreatedAt = DateTime.Now,
                    UpdatedAt = DateTime.Now
                }
            };

            var pagedResult = new PagedResult<AttributeResponse>(attributes, 2, page, pageSize);

            _mockAttributeRepository
                .Setup(r => r.GetAttributesAsync(search, page, pageSize, includeDeleted, It.IsAny<CancellationToken>()))
                .ReturnsAsync(pagedResult);

            // Act
            var result = await _attributeService!.GetAttributesAsync(search, page, pageSize, includeDeleted);

            // Assert
            Assert.NotNull(result);
            Assert.NotNull(result.Items);
            Assert.Equal(2, result.Total);
            Assert.Equal(2, result.Items.Count);
            Assert.True(result.Items.Any(a => a.IsDeleted == true));
        }

        /// <summary>
        /// UTCID04: GetAttributesAsync with search and includeDeleted=true
        /// Expected: Returns PagedResult with filtered and deleted items
        /// </summary>
        [Fact]
        public async Task UTCID04_GetAttributesAsync_WithSearchAndIncludeDeleted_ReturnsFilteredPagedResultWithDeletedItems()
        {
            // Arrange
            const int page = 1;
            const int pageSize = 10;
            const string search = "Size";
            const bool includeDeleted = true;

            var attributes = new List<AttributeResponse>
            {
                new AttributeResponse
                {
                    AttributeId = 2,
                    Name = "Size",
                    TypeValue = "String",
                    Unit = "cm",
                    IsDeleted = true,
                    CreatedAt = DateTime.Now,
                    UpdatedAt = DateTime.Now
                }
            };

            var pagedResult = new PagedResult<AttributeResponse>(attributes, 1, page, pageSize);

            _mockAttributeRepository
                .Setup(r => r.GetAttributesAsync(search, page, pageSize, includeDeleted, It.IsAny<CancellationToken>()))
                .ReturnsAsync(pagedResult);

            // Act
            var result = await _attributeService!.GetAttributesAsync(search, page, pageSize, includeDeleted);

            // Assert
            Assert.NotNull(result);
            Assert.NotNull(result.Items);
            Assert.Equal(1, result.Total);
            Assert.Single(result.Items);
            Assert.Equal("Size", result.Items.First().Name);
        }

        /// <summary>
        /// UTCID05: GetAttributesAsync with boundary pageSize=1
        /// Expected: Returns PagedResult with valid properties
        /// </summary>
        [Fact]
        public async Task UTCID05_GetAttributesAsync_BoundaryPageSize_ReturnsPagedResult()
        {
            // Arrange
            const int page = 1;
            const int pageSize = 1; // Boundary minimum
            string? search = null;
            const bool includeDeleted = false;

            var attributes = new List<AttributeResponse>
            {
                new AttributeResponse
                {
                    AttributeId = 1,
                    Name = "Color",
                    TypeValue = "String",
                    Unit = null,
                    IsDeleted = null,
                    CreatedAt = DateTime.Now,
                    UpdatedAt = DateTime.Now
                }
            };

            var pagedResult = new PagedResult<AttributeResponse>(attributes, 10, page, pageSize); // Total 10 items

            _mockAttributeRepository
                .Setup(r => r.GetAttributesAsync(search, page, pageSize, includeDeleted, It.IsAny<CancellationToken>()))
                .ReturnsAsync(pagedResult);

            // Act
            var result = await _attributeService!.GetAttributesAsync(search, page, pageSize, includeDeleted);

            // Assert
            Assert.NotNull(result);
            Assert.NotNull(result.Items);
            Assert.Equal(10, result.Total);
            Assert.Equal(page, result.Page);
            Assert.Equal(pageSize, result.PageSize);
            Assert.Single(result.Items); // Only 1 item per page
        }

        /// <summary>
        /// UTCID06: GetAttributesAsync with invalid page=0
        /// Expected: Throws ArgumentException with "Tham số phân trang không hợp lệ."
        /// </summary>
        [Fact]
        public async Task UTCID06_GetAttributesAsync_InvalidPageZero_ThrowsArgumentException()
        {
            // Arrange
            const int page = 0; // Invalid
            const int pageSize = 10;
            string? search = null;
            const bool includeDeleted = false;

            // Act & Assert
            var exception = await Assert.ThrowsAsync<ArgumentException>(
                async () => await _attributeService!.GetAttributesAsync(search, page, pageSize, includeDeleted));

            Assert.Equal("Tham số phân trang không hợp lệ.", exception.Message);

            // Verify repository was not called
            _mockAttributeRepository.Verify(
                r => r.GetAttributesAsync(It.IsAny<string>(), It.IsAny<int>(), It.IsAny<int>(), It.IsAny<bool>(), It.IsAny<CancellationToken>()),
                Times.Never);
        }

        /// <summary>
        /// UTCID07: GetAttributesAsync with invalid pageSize=0
        /// Expected: Throws ArgumentException with "Tham số phân trang không hợp lệ."
        /// </summary>
        [Fact]
        public async Task UTCID07_GetAttributesAsync_InvalidPageSizeZero_ThrowsArgumentException()
        {
            // Arrange
            const int page = 1;
            const int pageSize = 0; // Invalid
            string? search = null;
            const bool includeDeleted = false;

            // Act & Assert
            var exception = await Assert.ThrowsAsync<ArgumentException>(
                async () => await _attributeService!.GetAttributesAsync(search, page, pageSize, includeDeleted));

            Assert.Equal("Tham số phân trang không hợp lệ.", exception.Message);

            // Verify repository was not called
            _mockAttributeRepository.Verify(
                r => r.GetAttributesAsync(It.IsAny<string>(), It.IsAny<int>(), It.IsAny<int>(), It.IsAny<bool>(), It.IsAny<CancellationToken>()),
                Times.Never);
        }

        /// <summary>
        /// UTCID08: GetAttributesAsync with both invalid page=0 and pageSize=0
        /// Expected: Throws ArgumentException with "Tham số phân trang không hợp lệ."
        /// </summary>
        [Fact]
        public async Task UTCID08_GetAttributesAsync_InvalidPageAndPageSize_ThrowsArgumentException()
        {
            // Arrange
            const int page = 0; // Invalid
            const int pageSize = 0; // Invalid
            string? search = null;
            const bool includeDeleted = false;

            // Act & Assert
            var exception = await Assert.ThrowsAsync<ArgumentException>(
                async () => await _attributeService!.GetAttributesAsync(search, page, pageSize, includeDeleted));

            Assert.Equal("Tham số phân trang không hợp lệ.", exception.Message);

            // Verify repository was not called
            _mockAttributeRepository.Verify(
                r => r.GetAttributesAsync(It.IsAny<string>(), It.IsAny<int>(), It.IsAny<int>(), It.IsAny<bool>(), It.IsAny<CancellationToken>()),
                Times.Never);
        }
    }
}
