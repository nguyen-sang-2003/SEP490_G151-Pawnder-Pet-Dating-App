// BE/DTO/AttributeDtos.cs
namespace BE.DTO
{
    using System;
    using System.ComponentModel.DataAnnotations;

    public record AttributeResponse
    {
        public int AttributeId { get; init; }
        public string Name { get; init; } = null!;
        public string? TypeValue { get; init; }
        public bool? IsDeleted { get; init; }
        public string? Unit { get; init; }
        public DateTime? CreatedAt { get; init; }
        public DateTime? UpdatedAt { get; init; }
        public List<OptionRespone> optionRespones { get; init; } = new List<OptionRespone>();
    }

    public record AttributeCreateRequest
    {
        [Required(ErrorMessage = "Tên thuộc tính là bắt buộc.")]
        [StringLength(100, ErrorMessage = "Tên thuộc tính tối đa {1} ký tự.")]
        public string Name { get; init; } = null!;

        [StringLength(50, ErrorMessage = "Kiểu giá trị tối đa {1} ký tự.")]
        public string? TypeValue { get; init; }

        [StringLength(20, ErrorMessage = "Đơn vị tối đa {1} ký tự.")]
        public string? Unit { get; init; }

        public bool? IsDeleted { get; init; }
    }

    public record AttributeUpdateRequest
    {
        [Required(ErrorMessage = "Tên thuộc tính là bắt buộc.")]
        [StringLength(100, ErrorMessage = "Tên thuộc tính tối đa {1} ký tự.")]
        public string Name { get; init; } = null!;

        [StringLength(50, ErrorMessage = "Kiểu giá trị tối đa {1} ký tự.")]
        public string? TypeValue { get; init; }

        [StringLength(20, ErrorMessage = "Đơn vị tối đa {1} ký tự.")]
        public string? Unit { get; init; }

        public bool? IsDeleted { get; init; } // cho phép bật/tắt xoá mềm khi update (tuỳ bạn dùng hay không)
    }
    public record OptionRespone
    {
        public int OptionId { get; set; }

        public int? AttributeId { get; set; }

        public string Name { get; set; } = null!;

        public bool? IsDeleted { get; set; }
    }
}
