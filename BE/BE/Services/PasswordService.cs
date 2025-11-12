using System.Security.Cryptography;
using System.Text;

namespace BE.Services
{
    public class PasswordService
    {
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
