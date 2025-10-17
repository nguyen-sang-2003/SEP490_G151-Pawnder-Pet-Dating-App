using System;
using System.Collections.Generic;

namespace BE.Models;

public partial class Report
{
    public Guid ReportId { get; set; }

    public Guid? UserReportId { get; set; }

    public Guid? ContentId { get; set; }

    public string? Reason { get; set; }

    public string? Status { get; set; }

    public string? Resolution { get; set; }

    public DateTime? CreatedAt { get; set; }

    public DateTime? UpdatedAt { get; set; }

    public virtual ChatUserContent? Content { get; set; }

    public virtual User? UserReport { get; set; }
}
