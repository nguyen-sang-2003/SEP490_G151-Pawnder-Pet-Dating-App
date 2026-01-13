using System.Security.Cryptography;
using System.Text;
using System.Text.RegularExpressions;

namespace BE.Services
{
    public class PasswordService
    {
        // BR-22: Password complexity regex
        // Yêu cầu: ít nhất 1 chữ hoa, 1 chữ thường, 1 số, 1 ký tự đặc biệt, độ dài 8-100
        private static readonly Regex PasswordComplexityRegex = new(
            @"^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&.,#^()_+=\-\[\]{}|\\:;<>/~`])[A-Za-z\d@$!%*?&.,#^()_+=\-\[\]{}|\\:;<>/~`]{8,100}$",
            RegexOptions.Compiled);

        // BR-23: Email format regex
        private static readonly Regex EmailFormatRegex = new(
            @"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$",
            RegexOptions.Compiled | RegexOptions.IgnoreCase);

        /// <summary>
        /// BR-22: Validate password complexity
        /// Yêu cầu: ít nhất 8 ký tự, 1 chữ hoa, 1 chữ thường, 1 số, 1 ký tự đặc biệt
        /// </summary>
        public (bool IsValid, string? ErrorMessage) ValidatePasswordComplexity(string password)
        {
            if (string.IsNullOrWhiteSpace(password))
                return (false, "Mật khẩu không được để trống");

            if (password.Length < 8)
                return (false, "Mật khẩu phải có ít nhất 8 ký tự");

            if (password.Length > 100)
                return (false, "Mật khẩu không được quá 100 ký tự");

            if (!Regex.IsMatch(password, @"[a-z]"))
                return (false, "Mật khẩu phải có ít nhất 1 chữ thường (a-z)");

            if (!Regex.IsMatch(password, @"[A-Z]"))
                return (false, "Mật khẩu phải có ít nhất 1 chữ hoa (A-Z)");

            if (!Regex.IsMatch(password, @"\d"))
                return (false, "Mật khẩu phải có ít nhất 1 chữ số (0-9)");

            if (!Regex.IsMatch(password, @"[@$!%*?&.,#^()_+=\-\[\]{}|\\:;<>/~`]"))
                return (false, "Mật khẩu phải có ít nhất 1 ký tự đặc biệt (@$!%*?&.,#^()_+-=[]{}|\\:;<>/~`)");

            return (true, null);
        }

        /// <summary>
        /// BR-23: Validate email format
        /// </summary>
        public (bool IsValid, string? ErrorMessage) ValidateEmailFormat(string email)
        {
            if (string.IsNullOrWhiteSpace(email))
                return (false, "Email không được để trống");

            if (email.Length > 150)
                return (false, "Email không được quá 150 ký tự");

            if (!EmailFormatRegex.IsMatch(email))
                return (false, "Email không đúng định dạng (ví dụ: example@domain.com)");

            return (true, null);
        }

        /// <summary>
        /// Hash password using BCrypt (recommended for security)
        /// </summary>
        public string HashPassword(string password)
        {
            return BCrypt.Net.BCrypt.HashPassword(password);
        }

        /// <summary>
        /// Verify password - supports both BCrypt (new) and SHA256 (legacy)
        /// </summary>
        public bool VerifyPassword(string inputPassword, string hashedPassword)
        {
            // Check if it's a BCrypt hash (starts with $2a$, $2b$, or $2y$)
            if (hashedPassword.StartsWith("$2a$") || 
                hashedPassword.StartsWith("$2b$") || 
                hashedPassword.StartsWith("$2y$"))
            {
                // Verify using BCrypt
                try
                {
                    return BCrypt.Net.BCrypt.Verify(inputPassword, hashedPassword);
                }
                catch
                {
                    return false;
                }
            }
            else
            {
                // Legacy SHA256 verification (for old users)
                // This supports existing users until they login and get upgraded
                string hashedInput = HashPasswordSHA256(inputPassword);
                return hashedInput == hashedPassword;
            }
        }

        /// <summary>
        /// Check if password hash is legacy SHA256
        /// </summary>
        public bool IsLegacyHash(string hashedPassword)
        {
            // BCrypt hashes start with $2
            // SHA256 hashes are 64 hex characters
            return !hashedPassword.StartsWith("$2") && hashedPassword.Length == 64;
        }

        /// <summary>
        /// Legacy SHA256 hash for backward compatibility
        /// DO NOT use for new passwords!
        /// </summary>
        private string HashPasswordSHA256(string password)
        {
            using (var sha = SHA256.Create())
            {
                var bytes = sha.ComputeHash(Encoding.UTF8.GetBytes(password));
                var builder = new StringBuilder();

                foreach (var b in bytes)
                {
                    builder.Append(b.ToString("x2"));
                }

                return builder.ToString();
            }
        }
    }
}
