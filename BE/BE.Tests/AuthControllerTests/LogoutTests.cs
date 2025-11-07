using BE.Controllers;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Text;
using System.Threading.Tasks;

namespace BE.Tests.AuthControllerTests
{
    public class LogoutTests
    {
        private readonly GeneralConfiguration config = new GeneralConfiguration();
        private readonly AuthController _controller;

        public LogoutTests()
        {
            _controller = new AuthController(config.Context, config.TokenService);
        }
        [Fact]
        public async Task Logout_ValidUser_ReturnsOk()
        {
            var contextUser = new ClaimsPrincipal(new ClaimsIdentity(new[]
            {
            new Claim(ClaimTypes.NameIdentifier, "1")
            }, "mock"));

            _controller.ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext { User = contextUser }
            };

            var result = await _controller.Logout();

            var okResult = Assert.IsType<OkObjectResult>(result);
            Assert.Equal("Đăng xuất thành công.", okResult.Value);
        }
        [Fact]
        public async Task Logout_UserNotFound_ReturnsNotFound()
        {
            var contextUser = new ClaimsPrincipal(new ClaimsIdentity(new[]
            {
            new Claim(ClaimTypes.NameIdentifier, "9999") 
            }, "mock"));

            _controller.ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext { User = contextUser }
            };

            var result = await _controller.Logout();

            var notFound = Assert.IsType<NotFoundObjectResult>(result);
            Assert.Equal("Không tìm thấy người dùng.", notFound.Value);
        }
        [Fact]
        public async Task Logout_MissingUserId_ReturnsUnauthorized()
        {
            var contextUser = new ClaimsPrincipal(new ClaimsIdentity()); 

            _controller.ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext { User = contextUser }
            };

            var result = await _controller.Logout();

            var unauthorized = Assert.IsType<UnauthorizedObjectResult>(result);
            Assert.Equal("Không xác định được người dùng.", unauthorized.Value);
        }
    }
}
