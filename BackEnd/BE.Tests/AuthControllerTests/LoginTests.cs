using BE.Controllers;
using BE.DTO;
using BE.Models;
using BE.Services;
using Microsoft.AspNetCore.Mvc;
using Newtonsoft.Json.Linq;
using System.Threading.Tasks;
using Xunit;
using static BE.Controllers.AuthController;
namespace BE.Tests.AuthControllerTests
{
    public class LoginTests
    {
        private readonly GeneralConfiguration config = new GeneralConfiguration();
        private readonly AuthController _controller;

        public LoginTests()
        {
            _controller = new AuthController(config.Context, config.TokenService);
        }

        [Fact]
        public async Task Login_ValidCredentials_ReturnsOkWithToken()
        {

            string email = "user@example.com";
            string plainPassword = "123456";

            var request = new LoginRequest
            {
                Email = email,
                Password = plainPassword
            };

            var result = await _controller.Login(request);

            var okResult = Assert.IsType<OkObjectResult>(result);
            var value = JObject.FromObject(okResult.Value);

            Assert.Equal("Đăng nhập thành công", value["Message"].ToString());
        }

        [Fact]
        public async Task Login_InvalidEmail_ReturnsUnauthorized()
        {
            var request = new LoginRequest
            {
                Email = "notfound@example.com",
                Password = "123456"
            };

            var result = await _controller.Login(request);

            var unauthorized = Assert.IsType<UnauthorizedObjectResult>(result);
            Assert.Equal("Tài khoản không tồn tại", unauthorized.Value);
        }

        [Fact]
        public async Task Login_WrongPassword_ReturnsUnauthorized()
        {
            var request = new LoginRequest
            {
                Email = "user@example.com",
                Password = "sai_mat_khau"
            };

            var result = await _controller.Login(request);

            var unauthorized = Assert.IsType<UnauthorizedObjectResult>(result);
            Assert.Equal("Sai mật khẩu", unauthorized.Value);
        }
    }
}