namespace BE.DTO
{
    using System.ComponentModel.DataAnnotations;

    public record UserResponse
    {
        public int UserId { get; init; }
        public int? RoleId { get; init; }
        public int? UserStatusId { get; init; }
        public int? AddressId { get; init; }

        public string? FullName { get; init; }
        public string? Gender { get; init; }

        public string Email { get; init; } = null!;
        public string? ProviderLogin { get; init; }

        public bool IsDeleted { get; init; }
        public DateTime? CreatedAt { get; init; }
        public DateTime? UpdatedAt { get; init; }
    }

    public record UserCreateRequest
    {
        public int? RoleId { get; init; }
        public int? UserStatusId { get; init; }
        public int? AddressId { get; init; }

        [Required, StringLength(100)]
        public string? FullName { get; init; }

        [StringLength(10)]
        public string? Gender { get; init; }

        [Required, EmailAddress, StringLength(150)]
        public string Email { get; init; } = null!;

        [Required, StringLength(100, MinimumLength = 6)]
        public string Password { get; init; } = null!;

        [StringLength(50)]
        public string? ProviderLogin { get; init; }
    }

    public record UserUpdateRequest
    {
        public int? RoleId { get; init; }
        public int? UserStatusId { get; init; }
        public int? AddressId { get; init; }

        [Required, StringLength(100)]
        public string? FullName { get; init; }

        [StringLength(10)]
        public string? Gender { get; init; }

        // Cho phép đổi email (nếu dự án cần), sẽ kiểm tra trùng
       

        [StringLength(50)]
        public string? ProviderLogin { get; init; }

        // Nếu cần đổi mật khẩu
        [StringLength(100, MinimumLength = 6)]
        public string? NewPassword { get; init; }

        // Cho phép bật/tắt xoá mềm
        public bool? IsDeleted { get; init; }
    }

    public record PagedResult<T>(IReadOnlyList<T> Items, int Total, int Page, int PageSize);
}
