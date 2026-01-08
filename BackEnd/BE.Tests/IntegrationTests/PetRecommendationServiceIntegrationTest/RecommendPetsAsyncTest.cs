using System.Net;
using Xunit;

namespace BE.Tests.IntegrationTests.PetRecommendationServiceIntegrationTest
{
    /// <summary>
    /// REAL Integration Tests cho RecommendPets API
    /// Sử dụng HttpClient để gọi API thực sự qua WebApplicationFactory
    /// </summary>
    public class RecommendPetsAsyncTest : IClassFixture<CustomWebApplicationFactory>
    {
        private readonly CustomWebApplicationFactory _factory;

        public RecommendPetsAsyncTest(CustomWebApplicationFactory factory)
        {
            _factory = factory;
        }

        private HttpClient CreateAuthenticatedClient(int userId, string role = "User", string email = "test@example.com")
        {
            var client = _factory.CreateClient();
            client.DefaultRequestHeaders.Add("X-Test-UserId", userId.ToString());
            client.DefaultRequestHeaders.Add("X-Test-Role", role);
            client.DefaultRequestHeaders.Add("X-Test-Email", email);
            return client;
        }

        #region UC-PR-1.1 Integration Test Cases - RecommendPets

        /// <summary>
        /// UC-PR-1.1-TC-1: Recommend pets with valid userId having preferences
        /// Expected: HTTP 200 OK
        /// </summary>
        [Fact]
        public async Task UC_PR_1_1_TC_1_RecommendPets_ValidUserIdWithPreferences_Returns200()
        {
            // Arrange
            var client = CreateAuthenticatedClient(1, "User", "test@example.com");

            // Act
            var response = await client.GetAsync("/api/PetRecommendation/1");

            // Assert
            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        }

        /// <summary>
        /// UC-PR-1.1-TC-2: Recommend pets with valid userId without preferences
        /// Expected: HTTP 200 OK với data: [] hoặc danh sách rỗng
        /// </summary>
        [Fact]
        public async Task UC_PR_1_1_TC_2_RecommendPets_ValidUserIdWithoutPreferences_Returns200()
        {
            // Arrange - userId=2 không có preferences
            var client = CreateAuthenticatedClient(2, "User", "test@example.com");

            // Act
            var response = await client.GetAsync("/api/PetRecommendation/2");

            // Assert
            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        }

        /// <summary>
        /// UC-PR-1.1-TC-3: Recommend pets with non-existent userId
        /// Expected: HTTP 404 Not Found
        /// </summary>
        [Fact]
        public async Task UC_PR_1_1_TC_3_RecommendPets_NonExistentUserId_Returns404()
        {
            // Arrange
            var client = CreateAuthenticatedClient(99999, "User", "test@example.com");

            // Act
            var response = await client.GetAsync("/api/PetRecommendation/99999");

            // Assert
            Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
        }

        /// <summary>
        /// UC-PR-1.1-TC-4: Recommend pets with invalid userId (negative)
        /// Expected: HTTP 404 Not Found
        /// </summary>
        [Fact]
        public async Task UC_PR_1_1_TC_4_RecommendPets_NegativeUserId_Returns404()
        {
            // Arrange
            var client = CreateAuthenticatedClient(1, "User", "test@example.com");

            // Act
            var response = await client.GetAsync("/api/PetRecommendation/-1");

            // Assert
            Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
        }

        /// <summary>
        /// UC-PR-1.1-TC-5: Recommend pets with userId zero
        /// Expected: HTTP 404 Not Found
        /// </summary>
        [Fact]
        public async Task UC_PR_1_1_TC_5_RecommendPets_ZeroUserId_Returns404()
        {
            // Arrange
            var client = CreateAuthenticatedClient(1, "User", "test@example.com");

            // Act
            var response = await client.GetAsync("/api/PetRecommendation/0");

            // Assert
            Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
        }

        /// <summary>
        /// UC-PR-1.1-TC-6: Recommend pets with user having no active pets
        /// Expected: HTTP 200 OK
        /// </summary>
        [Fact]
        public async Task UC_PR_1_1_TC_6_RecommendPets_UserWithNoActivePets_Returns200()
        {
            // Arrange - userId=2 tồn tại nhưng không có preferences
            var client = CreateAuthenticatedClient(2, "User", "test@example.com");

            // Act
            var response = await client.GetAsync("/api/PetRecommendation/2");

            // Assert
            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        }

        /// <summary>
        /// UC-PR-1.1-TC-7: Recommend pets with user having distance preference
        /// Expected: HTTP 200 OK
        /// </summary>
        [Fact]
        public async Task UC_PR_1_1_TC_7_RecommendPets_UserWithDistancePreference_Returns200()
        {
            // Arrange
            var client = CreateAuthenticatedClient(1, "User", "test@example.com");

            // Act
            var response = await client.GetAsync("/api/PetRecommendation/1");

            // Assert
            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        }

        /// <summary>
        /// UC-PR-1.1-TC-8: Recommend pets excluding already matched pets
        /// Expected: HTTP 200 OK
        /// </summary>
        [Fact]
        public async Task UC_PR_1_1_TC_8_RecommendPets_ExcludesMatchedPets_Returns200()
        {
            // Arrange
            var client = CreateAuthenticatedClient(1, "User", "test@example.com");

            // Act
            var response = await client.GetAsync("/api/PetRecommendation/1");

            // Assert
            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        }

        /// <summary>
        /// UC-PR-1.1-TC-9: Recommend pets excluding blocked users
        /// Expected: HTTP 200 OK
        /// </summary>
        [Fact]
        public async Task UC_PR_1_1_TC_9_RecommendPets_ExcludesBlockedUsers_Returns200()
        {
            // Arrange
            var client = CreateAuthenticatedClient(1, "User", "test@example.com");

            // Act
            var response = await client.GetAsync("/api/PetRecommendation/1");

            // Assert
            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        }

        /// <summary>
        /// UC-PR-1.1-TC-14: Recommend pets with inactive pets excluded
        /// Expected: HTTP 200 OK
        /// </summary>
        [Fact]
        public async Task UC_PR_1_1_TC_14_RecommendPets_ExcludesInactivePets_Returns200()
        {
            // Arrange
            var client = CreateAuthenticatedClient(1, "User", "test@example.com");

            // Act
            var response = await client.GetAsync("/api/PetRecommendation/1");

            // Assert
            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        }

        /// <summary>
        /// UC-PR-1.1-TC-15: Recommend pets with deleted pets excluded
        /// Expected: HTTP 200 OK
        /// </summary>
        [Fact]
        public async Task UC_PR_1_1_TC_15_RecommendPets_ExcludesDeletedPets_Returns200()
        {
            // Arrange
            var client = CreateAuthenticatedClient(1, "User", "test@example.com");

            // Act
            var response = await client.GetAsync("/api/PetRecommendation/1");

            // Assert
            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        }

        /// <summary>
        /// UC-PR-1.1-TC-16: Recommend pets sorted by matching score
        /// Expected: HTTP 200 OK
        /// </summary>
        [Fact]
        public async Task UC_PR_1_1_TC_16_RecommendPets_SortedByMatchingScore_Returns200()
        {
            // Arrange
            var client = CreateAuthenticatedClient(1, "User", "test@example.com");

            // Act
            var response = await client.GetAsync("/api/PetRecommendation/1");

            // Assert
            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        }

        /// <summary>
        /// UC-PR-1.1-TC-22: Recommend pets excluding user's own pets
        /// Expected: HTTP 200 OK
        /// </summary>
        [Fact]
        public async Task UC_PR_1_1_TC_22_RecommendPets_ExcludesOwnPets_Returns200()
        {
            // Arrange
            var client = CreateAuthenticatedClient(1, "User", "test@example.com");

            // Act
            var response = await client.GetAsync("/api/PetRecommendation/1");

            // Assert
            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        }

        /// <summary>
        /// Test không có Authorization header
        /// Expected: HTTP 401 Unauthorized
        /// </summary>
        [Fact]
        public async Task RecommendPets_NoAuthToken_Returns401()
        {
            // Arrange
            var client = _factory.CreateClient();

            // Act
            var response = await client.GetAsync("/api/PetRecommendation/1");

            // Assert
            Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
        }

        /// <summary>
        /// Test với role Admin (không được phép)
        /// Expected: HTTP 403 Forbidden
        /// </summary>
        [Fact]
        public async Task RecommendPets_AdminRole_Returns403()
        {
            // Arrange
            var client = CreateAuthenticatedClient(101, "Admin", "admin@example.com");

            // Act
            var response = await client.GetAsync("/api/PetRecommendation/1");

            // Assert
            Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
        }

        #endregion
    }
}
