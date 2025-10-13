using System.Security.Cryptography;
using System.Text;

namespace BE.Services
{
    public class PasswordService
    {
        public string HashPassword(string password)
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
        public bool VerifyPassword(string inputPassword, string hashedPassword)
        {
            string hashedInput = HashPassword(inputPassword);
            return hashedInput == hashedPassword;
        }
    }
}
