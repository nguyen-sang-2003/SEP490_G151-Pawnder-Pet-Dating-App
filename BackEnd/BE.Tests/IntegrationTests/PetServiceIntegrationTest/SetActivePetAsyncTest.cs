using System.Net;
using System.Text.Json;
using Xunit;

namespace BE.Tests.IntegrationTests.PetServiceIntegrationTest
{
    /// <summary>
    /// REAL Integration Tests cho SetActivePet API
    /// Sử dụng HttpClient để gọi API thực sự qua WebApplicationFactory
    /// </summary>
    public class SetActivePetAsyncTest : IClassFixture<CustomWebApplicationFactory>
    {
        private readonly CustomWebApplicationFactory _factory;

        public SetActivePetAsyncTest(CustomWebApplicationFactory factory)
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

        #region UC-P-5.1 Integration Test Cases - SetActivePet

        /// <summary>
        /// UC-P-5.1-TC-1: Set active pet với valid petId
        /// Expected: HTTP 200 OK với message "Đã đặt thú cưng làm mặc định"
        /// </summary>
        [Fact]
        public async Task UC_P_5_1_TC_1_SetActivePet_ValidPetId_Returns200()
        {
            // Arrange
            var client = CreateAuthenticatedClient(1, "User", "test@example.com");

            // Act
            var response = await client.PutAsync("/api/Pet/1/set-active", null);

            // Assert
            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
            var responseContent = await response.Content.ReadAsStringAsync();
            Assert.Contains("Đã đặt thú cưng làm mặc định", responseContent);
        }

        /// <summary>
        /// UC-P-5.1-TC-2: Set active pet với non-existent petId
        /// Expected: HTTP 404 Not Found với message "Không tìm thấy thú cưng"
        /// </summary>
        [Fact]
        public async Task UC_P_5_1_TC_2_SetActivePet_NonExistentPetId_Returns404()
        {
            // Arrange
            var client = CreateAuthenticatedClient(1, "User", "test@example.com");

            // Act
            var response = await client.PutAsync("/api/Pet/99999/set-active", null);

            // Assert
            Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
            var responseContent = await response.Content.ReadAsStringAsync();
            Assert.Contains("Không tìm thấy thú cưng", responseContent);
        }

        /// <summary>
        /// UC-P-5.1-TC-3: Set active pet với invalid petId (negative)
        /// Expected: HTTP 404 Not Found với message "Không tìm thấy thú cưng"
        /// </summary>
        [Fact]
        public async Task UC_P_5_1_TC_3_SetActivePet_InvalidPetIdNegative_Returns404()
        {
            // Arrange
            var client = CreateAuthenticatedClient(1, "User", "test@example.com");

            // Act
            var response = await client.PutAsync("/api/Pet/-1/set-active", null);

            // Assert
            Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
            var responseContent = await response.Content.ReadAsStringAsync();
            Assert.Contains("Không tìm thấy thú cưng", responseContent);
        }

        /// <summary>
        /// UC-P-5.1-TC-4: Set active pet với petId zero
        /// Expected: HTTP 404 Not Found với message "Không tìm thấy thú cưng"
        /// </summary>
        [Fact]
        public async Task UC_P_5_1_TC_4_SetActivePet_PetIdZero_Returns404()
        {
            // Arrange
            var client = CreateAuthenticatedClient(1, "User", "test@example.com");

            // Act
            var response = await client.PutAsync("/api/Pet/0/set-active", null);

            // Assert
            Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
            var responseContent = await response.Content.ReadAsStringAsync();
            Assert.Contains("Không tìm thấy thú cưng", responseContent);
        }

        /// <summary>
        /// UC-P-5.1-TC-5: Set active pet với deleted pet
        /// Expected: HTTP 404 Not Found với message "Không tìm thấy thú cưng"
        /// </summary>
        [Fact]
        public async Task UC_P_5_1_TC_5_SetActivePet_DeletedPet_Returns404()
        {
            // Arrange
            var client = CreateAuthenticatedClient(1, "User", "test@example.com");

            // Act - petId = 5 là pet đã bị xóa (IsDeleted = true)
            var response = await client.PutAsync("/api/Pet/5/set-active", null);

            // Assert
            Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
            var responseContent = await response.Content.ReadAsStringAsync();
            Assert.Contains("Không tìm thấy thú cưng", responseContent);
        }

        /// <summary>
        /// Test không có Authorization header  
        /// Expected: HTTP 401 Unauthorized
        /// </summary>
        [Fact]
        public async Task SetActivePet_NoAuthToken_Returns401()
        {
            // Arrange - Client không có auth header
            var client = _factory.CreateClient();

            // Act
            var response = await client.PutAsync("/api/Pet/1/set-active", null);

            // Assert
            Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
        }

        /// <summary>
        /// Test với role không có quyền (Admin)
        /// Expected: HTTP 403 Forbidden (Admin không có quyền set active pet)
        /// </summary>
        [Fact]
        public async Task SetActivePet_AdminRole_Returns403()
        {
            // Arrange - Admin không có quyền thực hiện set active pet (chỉ User mới có)
            var client = CreateAuthenticatedClient(101, "Admin", "admin@example.com");

            // Act
            var response = await client.PutAsync("/api/Pet/1/set-active", null);

            // Assert
            Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
        }

        /// <summary>
        /// UC-P-5.1-TC-6: Set active pet với inactive pet (petId = 2)
        /// Expected: HTTP 200 OK với message "Đã đặt thú cưng làm mặc định"
        /// </summary>
        [Fact]
        public async Task UC_P_5_1_TC_6_SetActivePet_InactivePet_Returns200()
        {
            // Arrange
            var client = CreateAuthenticatedClient(1, "User", "test@example.com");

            // Act - petId = 2 là pet inactive của user 1
            var response = await client.PutAsync("/api/Pet/2/set-active", null);

            // Assert
            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
            var responseContent = await response.Content.ReadAsStringAsync();
            Assert.Contains("Đã đặt thú cưng làm mặc định", responseContent);
        }

        /// <summary>
        /// UC-P-5.1-TC-7: Set active pet với petId lớn không tồn tại (petId = 100)
        /// Expected: HTTP 404 Not Found với message "Không tìm thấy thú cưng"
        /// </summary>
        [Fact]
        public async Task UC_P_5_1_TC_7_SetActivePet_LargePetIdNotExist_Returns404()
        {
            // Arrange
            var client = CreateAuthenticatedClient(1, "User", "test@example.com");

            // Act - petId = 100 không tồn tại (petId 10, 11 được seed cho Report tests)
            var response = await client.PutAsync("/api/Pet/100/set-active", null);

            // Assert
            Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
            var responseContent = await response.Content.ReadAsStringAsync();
            Assert.Contains("Không tìm thấy thú cưng", responseContent);
        }

        /// <summary>
        /// UC-P-5.1-TC-8: Set active pet đã active sẵn (petId = 1)
        /// Expected: HTTP 200 OK - vẫn set thành công dù đã active
        /// </summary>
        [Fact]
        public async Task UC_P_5_1_TC_8_SetActivePet_AlreadyActivePet_Returns200()
        {
            // Arrange
            var client = CreateAuthenticatedClient(1, "User", "test@example.com");

            // Act - petId = 1 đã active sẵn
            var response = await client.PutAsync("/api/Pet/1/set-active", null);

            // Assert - Vẫn trả về 200 OK
            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
            var responseContent = await response.Content.ReadAsStringAsync();
            Assert.Contains("Đã đặt thú cưng làm mặc định", responseContent);
        }

        /// <summary>
        /// UC-P-5.1-TC-9: Set active pet của user khác (petId = 3 thuộc user 2)
        /// Expected: HTTP 200 OK (API không check ownership, chỉ check pet tồn tại)
        /// </summary>
        [Fact]
        public async Task UC_P_5_1_TC_9_SetActivePet_OtherUserPet_Returns200()
        {
            // Arrange - User 1 thử set active pet của user 2
            var client = CreateAuthenticatedClient(1, "User", "test@example.com");

            // Act - petId = 3 thuộc user 2
            var response = await client.PutAsync("/api/Pet/3/set-active", null);

            // Assert
            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
            var responseContent = await response.Content.ReadAsStringAsync();
            Assert.Contains("Đã đặt thú cưng làm mặc định", responseContent);
        }

        /// <summary>
        /// UC-P-5.1-TC-10: Set active với petId = 4 (inactive pet của user 2)
        /// Expected: HTTP 200 OK với message "Đã đặt thú cưng làm mặc định"
        /// </summary>
        [Fact]
        public async Task UC_P_5_1_TC_10_SetActivePet_AnotherInactivePet_Returns200()
        {
            // Arrange
            var client = CreateAuthenticatedClient(2, "User", "user2@example.com");

            // Act - petId = 4 là inactive pet của user 2
            var response = await client.PutAsync("/api/Pet/4/set-active", null);

            // Assert
            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
            var responseContent = await response.Content.ReadAsStringAsync();
            Assert.Contains("Đã đặt thú cưng làm mặc định", responseContent);
        }

        #endregion
    }
}
