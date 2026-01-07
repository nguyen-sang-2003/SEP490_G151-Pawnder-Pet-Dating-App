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
    public class UpdateReportAsyncTest : IDisposable
    {
        private readonly Mock<IReportRepository> _mockReportRepository;
        private readonly Mock<INotificationService> _mockNotificationService;
        private readonly PawnderDatabaseContext _context;
        private readonly ReportService _reportService;

        public UpdateReportAsyncTest()
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
        /// UTCID01: Normal case - Report exists, DTO provides Status & Resolution
        /// Condition: Report exists at first lookup, returned after save, DTO provides Status & Resolution
        /// Expected: Returns ReportDto, Status/Resolution updated, UpdatedAt refreshed
        /// </summary>
        [Fact]
        public async Task UTCID01_UpdateReportAsync_ReportExistsWithValidDto_ReturnsUpdatedReportDto()
        {
            // Arrange
            int reportId = 1;
            var cancellationToken = new CancellationToken();
            var originalUpdatedAt = DateTime.Now.AddDays(-1);

            var existingReport = new Report
            {
                ReportId = reportId,
                Reason = "Spam",
                Status = "Pending",
                Resolution = null,
                CreatedAt = DateTime.Now.AddDays(-2),
                UpdatedAt = originalUpdatedAt
            };

            var dto = new ReportUpdateDTO
            {
                Status = "Resolved",
                Resolution = "Warning issued to the user"
            };

            var updatedReportDto = new ReportDto
            {
                ReportId = reportId,
                Reason = "Spam",
                Status = "Resolved",
                Resolution = "Warning issued to the user",
                CreatedAt = existingReport.CreatedAt,
                UpdatedAt = DateTime.Now,
                UserReport = new UserReportDto
                {
                    UserId = 1,
                    FullName = "Test User",
                    Email = "test@example.com"
                }
            };

            _mockReportRepository
                .Setup(r => r.GetByIdAsync(reportId, cancellationToken))
                .ReturnsAsync(existingReport);

            _mockReportRepository
                .Setup(r => r.UpdateAsync(It.IsAny<Report>(), cancellationToken))
                .Returns(Task.CompletedTask);

            _mockReportRepository
                .Setup(r => r.GetReportByIdAsync(reportId, cancellationToken))
                .ReturnsAsync(updatedReportDto);

            _mockNotificationService
                .Setup(n => n.CreateNotificationAsync(It.IsAny<NotificationDto_1>(), cancellationToken))
                .ReturnsAsync(new Notification());

            // Act
            var result = await _reportService.UpdateReportAsync(reportId, dto, cancellationToken);

            // Assert
            Assert.NotNull(result);
            Assert.Equal(reportId, result.ReportId);
            Assert.Equal(dto.Status, result.Status);
            Assert.Equal(dto.Resolution, result.Resolution);

            // Verify repository interaction
            _mockReportRepository.Verify(
                r => r.GetByIdAsync(reportId, cancellationToken),
                Times.Once);
            _mockReportRepository.Verify(
                r => r.UpdateAsync(It.Is<Report>(rpt => 
                    rpt.Status == dto.Status && 
                    rpt.Resolution == dto.Resolution &&
                    rpt.UpdatedAt > originalUpdatedAt), cancellationToken),
                Times.Once);
            _mockReportRepository.Verify(
                r => r.GetReportByIdAsync(reportId, cancellationToken),
                Times.Once);
        }

        /// <summary>
        /// UTCID02: Abnormal case - Report exists at first lookup, missing after save
        /// Condition: Report exists at first lookup, missing after save (GetReportByIdAsync returns null)
        /// Expected: Throws KeyNotFoundException
        /// </summary>
        [Fact]
        public async Task UTCID02_UpdateReportAsync_ReportMissingAfterSave_ThrowsKeyNotFoundException()
        {
            // Arrange
            int reportId = 1;
            var cancellationToken = new CancellationToken();

            var existingReport = new Report
            {
                ReportId = reportId,
                Reason = "Spam",
                Status = "Pending",
                Resolution = null,
                CreatedAt = DateTime.Now.AddDays(-2),
                UpdatedAt = DateTime.Now.AddDays(-1)
            };

            var dto = new ReportUpdateDTO
            {
                Status = "Resolved",
                Resolution = "Warning issued"
            };

            _mockReportRepository
                .Setup(r => r.GetByIdAsync(reportId, cancellationToken))
                .ReturnsAsync(existingReport);

            _mockReportRepository
                .Setup(r => r.UpdateAsync(It.IsAny<Report>(), cancellationToken))
                .Returns(Task.CompletedTask);

            _mockReportRepository
                .Setup(r => r.GetReportByIdAsync(reportId, cancellationToken))
                .ReturnsAsync((ReportDto?)null);

            // Act & Assert
            var exception = await Assert.ThrowsAsync<KeyNotFoundException>(
                () => _reportService.UpdateReportAsync(reportId, dto, cancellationToken));

            Assert.Contains($"Report with ID {reportId} not found after update", exception.Message);

            // Verify repository interaction
            _mockReportRepository.Verify(
                r => r.GetByIdAsync(reportId, cancellationToken),
                Times.Once);
            _mockReportRepository.Verify(
                r => r.UpdateAsync(It.IsAny<Report>(), cancellationToken),
                Times.Once);
            _mockReportRepository.Verify(
                r => r.GetReportByIdAsync(reportId, cancellationToken),
                Times.Once);
        }

        /// <summary>
        /// UTCID03: Abnormal case - Report missing at first lookup
        /// Condition: Report missing at first lookup (GetByIdAsync returns null)
        /// Expected: Throws KeyNotFoundException
        /// </summary>
        [Fact]
        public async Task UTCID03_UpdateReportAsync_ReportNotFound_ThrowsKeyNotFoundException()
        {
            // Arrange
            int reportId = 999;
            var cancellationToken = new CancellationToken();

            var dto = new ReportUpdateDTO
            {
                Status = null,
                Resolution = null
            };

            _mockReportRepository
                .Setup(r => r.GetByIdAsync(reportId, cancellationToken))
                .ReturnsAsync((Report?)null);

            // Act & Assert
            var exception = await Assert.ThrowsAsync<KeyNotFoundException>(
                () => _reportService.UpdateReportAsync(reportId, dto, cancellationToken));

            Assert.Contains($"Report with ID {reportId} not found", exception.Message);

            // Verify repository interaction - only GetByIdAsync should be called
            _mockReportRepository.Verify(
                r => r.GetByIdAsync(reportId, cancellationToken),
                Times.Once);
            _mockReportRepository.Verify(
                r => r.UpdateAsync(It.IsAny<Report>(), It.IsAny<CancellationToken>()),
                Times.Never);
            _mockReportRepository.Verify(
                r => r.GetReportByIdAsync(It.IsAny<int>(), It.IsAny<CancellationToken>()),
                Times.Never);
        }

        /// <summary>
        /// UTCID04: Normal case - Report exists, DTO Status/Resolution null/empty
        /// Condition: Report exists, DTO provides null/empty Status & Resolution
        /// Expected: Keeps existing Status/Resolution, UpdatedAt refreshed
        /// </summary>
        [Fact]
        public async Task UTCID04_UpdateReportAsync_DtoNullOrEmpty_KeepsExistingValues()
        {
            // Arrange
            int reportId = 1;
            var cancellationToken = new CancellationToken();
            var originalStatus = "Pending";
            var originalResolution = "Under review";
            var originalUpdatedAt = DateTime.Now.AddDays(-1);

            var existingReport = new Report
            {
                ReportId = reportId,
                Reason = "Spam",
                Status = originalStatus,
                Resolution = originalResolution,
                CreatedAt = DateTime.Now.AddDays(-2),
                UpdatedAt = originalUpdatedAt
            };

            var dto = new ReportUpdateDTO
            {
                Status = null,
                Resolution = ""
            };

            var updatedReportDto = new ReportDto
            {
                ReportId = reportId,
                Reason = "Spam",
                Status = originalStatus,
                Resolution = originalResolution,
                CreatedAt = existingReport.CreatedAt,
                UpdatedAt = DateTime.Now,
                UserReport = new UserReportDto
                {
                    UserId = 1,
                    FullName = "Test User",
                    Email = "test@example.com"
                }
            };

            _mockReportRepository
                .Setup(r => r.GetByIdAsync(reportId, cancellationToken))
                .ReturnsAsync(existingReport);

            _mockReportRepository
                .Setup(r => r.UpdateAsync(It.IsAny<Report>(), cancellationToken))
                .Returns(Task.CompletedTask);

            _mockReportRepository
                .Setup(r => r.GetReportByIdAsync(reportId, cancellationToken))
                .ReturnsAsync(updatedReportDto);

            _mockNotificationService
                .Setup(n => n.CreateNotificationAsync(It.IsAny<NotificationDto_1>(), cancellationToken))
                .ReturnsAsync(new Notification());

            // Act
            var result = await _reportService.UpdateReportAsync(reportId, dto, cancellationToken);

            // Assert
            Assert.NotNull(result);
            Assert.Equal(reportId, result.ReportId);
            Assert.Equal(originalStatus, result.Status);
            Assert.Equal(originalResolution, result.Resolution);

            // Verify repository interaction
            _mockReportRepository.Verify(
                r => r.GetByIdAsync(reportId, cancellationToken),
                Times.Once);
            _mockReportRepository.Verify(
                r => r.UpdateAsync(It.Is<Report>(rpt => 
                    rpt.Status == originalStatus && 
                    rpt.Resolution == originalResolution &&
                    rpt.UpdatedAt > originalUpdatedAt), cancellationToken),
                Times.Once);
            _mockReportRepository.Verify(
                r => r.GetReportByIdAsync(reportId, cancellationToken),
                Times.Once);
        }

        #endregion
    }
}
