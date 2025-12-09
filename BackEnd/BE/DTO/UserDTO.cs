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
        public bool isProfileComplete { get; init; } = false;
        public bool IsDeleted { get; init; }
        public DateTime? CreatedAt { get; init; }
        public DateTime? UpdatedAt { get; init; }
 

  

   
    }

    public record UserCreateRequest
    {
        // NOTE: RoleId is IGNORED during registration. All new users are assigned User role (RoleId = 3)
        // This field is kept for backward compatibility but should not be sent by clients
        public int? RoleId { get; init; }
        public int? UserStatusId { get; init; }
      

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

        public bool isDelete {get; init; } = false;

        public bool isProfileComplete { get; init; } = false;
    }

    public record UserUpdateRequest
    {
   
        public int? AddressId { get; init; }

        [Required, StringLength(100)]
        public string? FullName { get; init; }

        [StringLength(10)]
        public string? Gender { get; init; }

        // Cho phép đổi email (nếu dự án cần), sẽ kiểm tra trùng
       
        // Nếu cần đổi mật khẩu
        [StringLength(100, MinimumLength = 6)]
        public string? NewPassword { get; init; }

    
    }
    public record AdUserUpdateRequest
    {
        public int? RoleId { get; init; }

        public bool? isDelete { get; init; } = false;

        public int? userStatusId { get; init; }

    }
    public record AdUserCreateRequest
    {
        public int? RoleId { get; init; }
        public int? UserStatusId { get; init; }


        [Required, StringLength(100)]
        public string? FullName { get; init; }

        [StringLength(10)]
        public string? Gender { get; init; }

        [Required, EmailAddress, StringLength(150)]
        public string Email { get; init; } = null!;

        [Required, StringLength(100, MinimumLength = 6)]
        public string Password { get; init; } = null!;

       

        public bool isDelete { get; init; } = false;

        public bool? IsProfileComplete { get; init; }

       
    }

    public record ResetPasswordRequest
    {
        [Required, EmailAddress]
        public string Email { get; init; } = null!;

        [Required, StringLength(100, MinimumLength = 6)]
        public string NewPassword { get; init; } = null!;
    }
  
    public record ChangePasswordRequest
    {
        [Required, StringLength(100, MinimumLength = 6)]
        public string CurrentPassword { get; init; } = null!;

        [Required, StringLength(100, MinimumLength = 6)]
        public string NewPassword { get; init; } = null!;
    }
  
    public record PagedResult<T>(IReadOnlyList<T> Items, int Total, int Page, int PageSize);
}
