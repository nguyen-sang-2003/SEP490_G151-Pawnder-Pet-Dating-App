using BE.DTO;
using BE.Models;
using BE.Repositories.Interfaces;
using BE.Services;
using BE.Services.Interfaces;
using Microsoft.EntityFrameworkCore;
using Moq;
using Xunit;

namespace BE.Tests.Services.ReportServiceTest
{
    public class GetReportByIdAsyncTest : IDisposable
    {
        private readonly Mock<IReportRepository> _mockReportRepository;
        private readonly Mock<INotificationService> _mockNotificationService;
        private readonly PawnderDatabaseContext _context;
        private readonly ReportService _reportService;

        public GetReportByIdAsyncTest()
        {
            // Setup: Khởi tạo mocks
            _mockReportRepository = new Mock<IReportRepository>();
            _mockNotificationService = new Mock<INotificationService>();

            // Create real InMemory DbContext
            var options = new DbContextOptionsBuilder<PawnderDatabaseContext>()
                .UseInMemoryDatabase(databaseName: "TestDatabase_" + Guid.NewGuid().ToString())
                .Options;

            _context = new PawnderDatabaseContext(options);

            // Khởi tạo service
            _reportService = new ReportService(
                _mockReportRepository.Object,
                _context,
                _mockNotificationService.Object
            );
        }

        public void Dispose()
        {
            _context?.Dispose();
        }

        #region UTCID Tests

        /// <summary>
        /// UTCID01: Normal case - ReportId > 0, repository returns ReportDto
        /// Condition: ReportId > 0, GetReportByIdAsync returns ReportDto
        /// Expected: Return ReportDto, ReportId matches input, Reason/Status/Resolution preserved, UserReport info preserved
        /// </summary>
        [Fact]
        public async Task UTCID01_GetReportByIdAsync_ValidReportIdReturnsData_ReturnsCorrectReportDto()
        {
            // Arrange
            int reportId = 1;
            var cancellationToken = new CancellationToken();

            var reportDto = new ReportDto
            {
                ReportId = reportId,
                Reason = "Spam content",
                Status = "Pending",
                Resolution = "Under review",
                CreatedAt = DateTime.Now,
                UpdatedAt = DateTime.Now,
                UserReport = new UserReportDto
                {
                    UserId = 1,
                    FullName = "Test User",
                    Email = "test@example.com"
                }
            };

            _mockReportRepository
                .Setup(r => r.GetReportByIdAsync(reportId, cancellationToken))
                .ReturnsAsync(reportDto);

            // Act
            var result = await _reportService.GetReportByIdAsync(reportId, cancellationToken);

            // Assert
            Assert.NotNull(result);
            Assert.Equal(reportId, result.ReportId);
            Assert.Equal(reportDto.Reason, result.Reason);
            Assert.Equal(reportDto.Status, result.Status);
            Assert.Equal(reportDto.Resolution, result.Resolution);
            Assert.NotNull(result.UserReport);
            Assert.Equal(reportDto.UserReport.UserId, result.UserReport.UserId);
            Assert.Equal(reportDto.UserReport.FullName, result.UserReport.FullName);
            Assert.Equal(reportDto.UserReport.Email, result.UserReport.Email);

            // Verify repository interaction
            _mockReportRepository.Verify(
                r => r.GetReportByIdAsync(reportId, cancellationToken),
                Times.Once);
        }

        /// <summary>
        /// UTCID02: Abnormal case - ReportId > 0, repository returns null (not found)
        /// Condition: ReportId > 0, GetReportByIdAsync returns null
        /// Expected: Return null
        /// </summary>
        [Fact]
        public async Task UTCID02_GetReportByIdAsync_ValidReportIdNotFound_ReturnsNull()
        {
            // Arrange
            int reportId = 999;
            var cancellationToken = new CancellationToken();

            _mockReportRepository
                .Setup(r => r.GetReportByIdAsync(reportId, cancellationToken))
                .ReturnsAsync((ReportDto?)null);

            // Act
            var result = await _reportService.GetReportByIdAsync(reportId, cancellationToken);

            // Assert
            Assert.Null(result);

            // Verify repository interaction
            _mockReportRepository.Verify(
                r => r.GetReportByIdAsync(reportId, cancellationToken),
                Times.Once);
        }

        /// <summary>
        /// UTCID03: Abnormal case - ReportId = 0
        /// Condition: ReportId = 0, GetReportByIdAsync returns null
        /// Expected: Return null
        /// </summary>
        [Fact]
        public async Task UTCID03_GetReportByIdAsync_ReportIdZero_ReturnsNull()
        {
            // Arrange
            int reportId = 0;
            var cancellationToken = new CancellationToken();

            _mockReportRepository
                .Setup(r => r.GetReportByIdAsync(reportId, cancellationToken))
                .ReturnsAsync((ReportDto?)null);

            // Act
            var result = await _reportService.GetReportByIdAsync(reportId, cancellationToken);

            // Assert
            Assert.Null(result);

            // Verify repository interaction
            _mockReportRepository.Verify(
                r => r.GetReportByIdAsync(reportId, cancellationToken),
                Times.Once);
        }

        /// <summary>
        /// UTCID04: Abnormal case - ReportId < 0
        /// Condition: ReportId < 0, GetReportByIdAsync returns null
        /// Expected: Return null
        /// </summary>
        [Fact]
        public async Task UTCID04_GetReportByIdAsync_ReportIdNegative_ReturnsNull()
        {
            // Arrange
            int reportId = -1;
            var cancellationToken = new CancellationToken();

            _mockReportRepository
                .Setup(r => r.GetReportByIdAsync(reportId, cancellationToken))
                .ReturnsAsync((ReportDto?)null);

            // Act
            var result = await _reportService.GetReportByIdAsync(reportId, cancellationToken);

            // Assert
            Assert.Null(result);

            // Verify repository interaction
            _mockReportRepository.Verify(
                r => r.GetReportByIdAsync(reportId, cancellationToken),
                Times.Once);
        }

        /// <summary>
        /// UTCID05: Boundary case - ReportId = int.MaxValue
        /// Condition: ReportId = int.MaxValue, GetReportByIdAsync returns null
        /// Expected: Return null
        /// </summary>
        [Fact]
        public async Task UTCID05_GetReportByIdAsync_ReportIdMaxValue_ReturnsNull()
        {
            // Arrange
            int reportId = int.MaxValue;
            var cancellationToken = new CancellationToken();

            _mockReportRepository
                .Setup(r => r.GetReportByIdAsync(reportId, cancellationToken))
                .ReturnsAsync((ReportDto?)null);

            // Act
            var result = await _reportService.GetReportByIdAsync(reportId, cancellationToken);

            // Assert
            Assert.Null(result);

            // Verify repository interaction
            _mockReportRepository.Verify(
                r => r.GetReportByIdAsync(reportId, cancellationToken),
                Times.Once);
        }

        /// <summary>
        /// UTCID06: Boundary case - ReportId = int.MinValue
        /// Condition: ReportId = int.MinValue, GetReportByIdAsync returns null
        /// Expected: Return null
        /// </summary>
        [Fact]
        public async Task UTCID06_GetReportByIdAsync_ReportIdMinValue_ReturnsNull()
        {
            // Arrange
            int reportId = int.MinValue;
            var cancellationToken = new CancellationToken();

            _mockReportRepository
                .Setup(r => r.GetReportByIdAsync(reportId, cancellationToken))
                .ReturnsAsync((ReportDto?)null);

            // Act
            var result = await _reportService.GetReportByIdAsync(reportId, cancellationToken);

            // Assert
            Assert.Null(result);

            // Verify repository interaction
            _mockReportRepository.Verify(
                r => r.GetReportByIdAsync(reportId, cancellationToken),
                Times.Once);
        }

        #endregion
    }
}
