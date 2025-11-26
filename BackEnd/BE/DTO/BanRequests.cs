using System.ComponentModel;
using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace BE.DTO
{
    public class BanUserRequest
    {
        public string? Reason { get; set; }

        // Ban theo NGÀY hoặc VĨNH VIỄN
        [DefaultValue(1)]
        [JsonPropertyName("durationDays")]
        public int DurationDays { get; set; }

        // true => ban vĩnh viễn (BanEnd = null)
        [DefaultValue(false)]
        [JsonPropertyName("isPermanent")]
        public bool IsPermanent { get; set; }
    }

    public class UnbanUserRequest
    {
        public string? Reason { get; set; }
    }
}


