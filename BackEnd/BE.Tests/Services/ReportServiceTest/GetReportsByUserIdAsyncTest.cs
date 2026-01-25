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
    public class GetReportsByUserIdAsyncTest : IDisposable
    {
        private readonly Mock<IReportRepository> _mockReportRepository;
        private readonly Mock<INotificationService> _mockNotificationService;
        private readonly PawnderDatabaseContext _context;
        private readonly ReportService _reportService;

        public GetReportsByUserIdAsyncTest()
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
        /// UTCID01: Normal case - UserReportId > 0, repository returns list with data
        /// Condition: UserReportId > 0, GetReportsByUserIdAsync returns list with items
        /// Expected: Return IEnumerable<object>, count matches repository result, items preserve order/content
        /// </summary>
        [Fact]
        public async Task UTCID01_GetReportsByUserIdAsync_ValidUserIdReturnsList_ReturnsCorrectData()
        {
            // Arrange
            int userReportId = 1;
            var cancellationToken = new CancellationToken();

            var reports = new List<object>
            {
                new
                {
                    ReportId = 1,
                    Reason = "Spam",
                    Status = "Pending",
                    CreatedAt = DateTime.Now
                },
                new
                {
                    ReportId = 2,
                    Reason = "Harassment",
                    Status = "Resolved",
                    CreatedAt = DateTime.Now
                }
            };

            _mockReportRepository
                .Setup(r => r.GetReportsByUserIdAsync(userReportId, cancellationToken))
                .ReturnsAsync(reports);

            // Act
            var result = await _reportService.GetReportsByUserIdAsync(userReportId, cancellationToken);

            // Assert
            Assert.NotNull(result);
            var resultList = result.ToList();
            Assert.Equal(reports.Count, resultList.Count);

            // Verify repository interaction
            _mockReportRepository.Verify(
                r => r.GetReportsByUserIdAsync(userReportId, cancellationToken),
                Times.Once);
        }

        /// <summary>
        /// UTCID02: Normal case - UserReportId > 0, repository returns empty list
        /// Condition: UserReportId > 0, GetReportsByUserIdAsync returns empty list
        /// Expected: Return IEnumerable<object> with count 0
        /// </summary>
        [Fact]
        public async Task UTCID02_GetReportsByUserIdAsync_ValidUserIdReturnsEmptyList_ReturnsEmptyEnumerable()
        {
            // Arrange
            int userReportId = 1;
            var cancellationToken = new CancellationToken();
            var emptyReports = new List<object>();

            _mockReportRepository
                .Setup(r => r.GetReportsByUserIdAsync(userReportId, cancellationToken))
                .ReturnsAsync(emptyReports);

            // Act
            var result = await _reportService.GetReportsByUserIdAsync(userReportId, cancellationToken);

            // Assert
            Assert.NotNull(result);
            var resultList = result.ToList();
            Assert.Empty(resultList);
            Assert.Equal(0, resultList.Count);

            // Verify repository interaction
            _mockReportRepository.Verify(
                r => r.GetReportsByUserIdAsync(userReportId, cancellationToken),
                Times.Once);
        }

        /// <summary>
        /// UTCID03: Abnormal case - UserReportId > 0, repository returns null
        /// Condition: UserReportId > 0, GetReportsByUserIdAsync returns null
        /// Expected: Return null
        /// </summary>
        [Fact]
        public async Task UTCID03_GetReportsByUserIdAsync_ValidUserIdReturnsNull_ReturnsNull()
        {
            // Arrange
            int userReportId = 1;
            var cancellationToken = new CancellationToken();

            _mockReportRepository
                .Setup(r => r.GetReportsByUserIdAsync(userReportId, cancellationToken))
                .ReturnsAsync((IEnumerable<object>?)null!);

            // Act
            var result = await _reportService.GetReportsByUserIdAsync(userReportId, cancellationToken);

            // Assert
            Assert.Null(result);

            // Verify repository interaction
            _mockReportRepository.Verify(
                r => r.GetReportsByUserIdAsync(userReportId, cancellationToken),
                Times.Once);
        }

        /// <summary>
        /// UTCID04: Exception case - UserReportId > 0, repository throws InvalidOperationException
        /// Condition: UserReportId > 0, GetReportsByUserIdAsync throws InvalidOperationException
        /// Expected: Exception propagates
        /// </summary>
        [Fact]
        public async Task UTCID04_GetReportsByUserIdAsync_ThrowsInvalidOperationException_ExceptionPropagates()
        {
            // Arrange
            int userReportId = 1;
            var cancellationToken = new CancellationToken();
            var exceptionMessage = "Invalid operation occurred";

            _mockReportRepository
                .Setup(r => r.GetReportsByUserIdAsync(userReportId, cancellationToken))
                .ThrowsAsync(new InvalidOperationException(exceptionMessage));

            // Act & Assert
            var exception = await Assert.ThrowsAsync<InvalidOperationException>(
                () => _reportService.GetReportsByUserIdAsync(userReportId, cancellationToken));

            Assert.Equal(exceptionMessage, exception.Message);

            // Verify repository interaction
            _mockReportRepository.Verify(
                r => r.GetReportsByUserIdAsync(userReportId, cancellationToken),
                Times.Once);
        }

        /// <summary>
        /// UTCID05: Boundary case - UserReportId = 0
        /// Condition: UserReportId = 0, GetReportsByUserIdAsync returns empty list
        /// Expected: Return IEnumerable<object> (empty), repository called with correct parameter
        /// </summary>
        [Fact]
        public async Task UTCID05_GetReportsByUserIdAsync_UserIdZero_ReturnsEmptyEnumerable()
        {
            // Arrange
            int userReportId = 0;
            var cancellationToken = new CancellationToken();
            var emptyReports = new List<object>();

            _mockReportRepository
                .Setup(r => r.GetReportsByUserIdAsync(userReportId, cancellationToken))
                .ReturnsAsync(emptyReports);

            // Act
            var result = await _reportService.GetReportsByUserIdAsync(userReportId, cancellationToken);

            // Assert
            Assert.NotNull(result);
            var resultList = result.ToList();
            Assert.Empty(resultList);

            // Verify repository interaction - parameter userReportId preserved
            _mockReportRepository.Verify(
                r => r.GetReportsByUserIdAsync(userReportId, cancellationToken),
                Times.Once);
        }

        /// <summary>
        /// UTCID06: Boundary case - UserReportId < 0
        /// Condition: UserReportId < 0, GetReportsByUserIdAsync returns empty list
        /// Expected: Return IEnumerable<object> (empty), repository called with correct parameter
        /// </summary>
        [Fact]
        public async Task UTCID06_GetReportsByUserIdAsync_UserIdNegative_ReturnsEmptyEnumerable()
        {
            // Arrange
            int userReportId = -1;
            var cancellationToken = new CancellationToken();
            var emptyReports = new List<object>();

            _mockReportRepository
                .Setup(r => r.GetReportsByUserIdAsync(userReportId, cancellationToken))
                .ReturnsAsync(emptyReports);

            // Act
            var result = await _reportService.GetReportsByUserIdAsync(userReportId, cancellationToken);

            // Assert
            Assert.NotNull(result);
            var resultList = result.ToList();
            Assert.Empty(resultList);

            // Verify repository interaction - parameter userReportId preserved
            _mockReportRepository.Verify(
                r => r.GetReportsByUserIdAsync(userReportId, cancellationToken),
                Times.Once);
        }

        #endregion
    }
}
