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
    public class GetAllReportsAsyncTest : IDisposable
    {
        private readonly Mock<IReportRepository> _mockReportRepository;
        private readonly Mock<INotificationService> _mockNotificationService;
        private readonly PawnderDatabaseContext _context;
        private readonly ReportService _reportService;

        public GetAllReportsAsyncTest()
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
        /// UTCID01: Normal case - Repository returns a list with data
        /// Condition: GetAllReportsAsync returns list with items
        /// Expected: Return IEnumerable<ReportDto>, count matches repository result, items preserve order/content
        /// </summary>
        [Fact]
        public async Task UTCID01_GetAllReportsAsync_ReturnsListWithData_ReturnsCorrectReportDtos()
        {
            // Arrange
            var reports = new List<ReportDto>
            {
                new ReportDto
                {
                    ReportId = 1,
                    Reason = "Spam",
                    Status = "Pending",
                    Resolution = null,
                    CreatedAt = DateTime.Now,
                    UpdatedAt = DateTime.Now,
                    UserReport = new UserReportDto
                    {
                        UserId = 1,
                        FullName = "User 1",
                        Email = "user1@example.com"
                    }
                },
                new ReportDto
                {
                    ReportId = 2,
                    Reason = "Harassment",
                    Status = "Resolved",
                    Resolution = "Warning issued",
                    CreatedAt = DateTime.Now,
                    UpdatedAt = DateTime.Now,
                    UserReport = new UserReportDto
                    {
                        UserId = 2,
                        FullName = "User 2",
                        Email = "user2@example.com"
                    }
                }
            };

            var cancellationToken = new CancellationToken();

            _mockReportRepository
                .Setup(r => r.GetAllReportsAsync(cancellationToken))
                .ReturnsAsync(reports);

            // Act
            var result = await _reportService.GetAllReportsAsync(cancellationToken);

            // Assert
            Assert.NotNull(result);
            var resultList = result.ToList();
            Assert.Equal(reports.Count, resultList.Count);
            Assert.Equal(reports[0].ReportId, resultList[0].ReportId);
            Assert.Equal(reports[0].Reason, resultList[0].Reason);
            Assert.Equal(reports[1].ReportId, resultList[1].ReportId);
            Assert.Equal(reports[1].Reason, resultList[1].Reason);
            
            // Verify repository interaction
            _mockReportRepository.Verify(
                r => r.GetAllReportsAsync(cancellationToken),
                Times.Once);
        }

        /// <summary>
        /// UTCID02: Normal case - Repository returns empty list
        /// Condition: GetAllReportsAsync returns empty list
        /// Expected: Return IEnumerable<ReportDto> with count 0, items preserve order/content (empty)
        /// </summary>
        [Fact]
        public async Task UTCID02_GetAllReportsAsync_ReturnsEmptyList_ReturnsEmptyEnumerable()
        {
            // Arrange
            var emptyReports = new List<ReportDto>();
            var cancellationToken = new CancellationToken();

            _mockReportRepository
                .Setup(r => r.GetAllReportsAsync(cancellationToken))
                .ReturnsAsync(emptyReports);

            // Act
            var result = await _reportService.GetAllReportsAsync(cancellationToken);

            // Assert
            Assert.NotNull(result);
            var resultList = result.ToList();
            Assert.Empty(resultList);
            Assert.Equal(0, resultList.Count);
            
            // Verify repository interaction
            _mockReportRepository.Verify(
                r => r.GetAllReportsAsync(cancellationToken),
                Times.Once);
        }

        /// <summary>
        /// UTCID03: Abnormal case - Repository returns null
        /// Condition: GetAllReportsAsync returns null
        /// Expected: Return null
        /// </summary>
        [Fact]
        public async Task UTCID03_GetAllReportsAsync_ReturnsNull_ReturnsNull()
        {
            // Arrange
            var cancellationToken = new CancellationToken();

            _mockReportRepository
                .Setup(r => r.GetAllReportsAsync(cancellationToken))
                .ReturnsAsync((IEnumerable<ReportDto>?)null!);

            // Act
            var result = await _reportService.GetAllReportsAsync(cancellationToken);

            // Assert
            Assert.Null(result);
            
            // Verify repository interaction
            _mockReportRepository.Verify(
                r => r.GetAllReportsAsync(cancellationToken),
                Times.Once);
        }

        /// <summary>
        /// UTCID04: Exception case - Repository throws InvalidOperationException
        /// Condition: GetAllReportsAsync throws InvalidOperationException
        /// Expected: Exception propagates
        /// </summary>
        [Fact]
        public async Task UTCID04_GetAllReportsAsync_ThrowsInvalidOperationException_ExceptionPropagates()
        {
            // Arrange
            var cancellationToken = new CancellationToken();
            var exceptionMessage = "Invalid operation occurred";

            _mockReportRepository
                .Setup(r => r.GetAllReportsAsync(cancellationToken))
                .ThrowsAsync(new InvalidOperationException(exceptionMessage));

            // Act & Assert
            var exception = await Assert.ThrowsAsync<InvalidOperationException>(
                () => _reportService.GetAllReportsAsync(cancellationToken));
            
            Assert.Equal(exceptionMessage, exception.Message);
            
            // Verify repository interaction
            _mockReportRepository.Verify(
                r => r.GetAllReportsAsync(cancellationToken),
                Times.Once);
        }

        /// <summary>
        /// UTCID05: Exception case - Repository throws OperationCanceledException
        /// Condition: GetAllReportsAsync throws OperationCanceledException
        /// Expected: Exception propagates
        /// </summary>
        [Fact]
        public async Task UTCID05_GetAllReportsAsync_ThrowsOperationCanceledException_ExceptionPropagates()
        {
            // Arrange
            var cancellationTokenSource = new CancellationTokenSource();
            cancellationTokenSource.Cancel();
            var cancellationToken = cancellationTokenSource.Token;

            _mockReportRepository
                .Setup(r => r.GetAllReportsAsync(It.IsAny<CancellationToken>()))
                .ThrowsAsync(new OperationCanceledException("Operation was canceled"));

            // Act & Assert
            var exception = await Assert.ThrowsAsync<OperationCanceledException>(
                () => _reportService.GetAllReportsAsync(cancellationToken));
            
            // Verify repository interaction
            _mockReportRepository.Verify(
                r => r.GetAllReportsAsync(It.IsAny<CancellationToken>()),
                Times.Once);
        }

        #endregion
    }
}
