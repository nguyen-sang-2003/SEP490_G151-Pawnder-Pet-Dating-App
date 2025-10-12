using System;
using System.Collections.Generic;

namespace BE.Models;

public partial class Report
{
    public int Reportid { get; set; }

    public int? Fromuserid { get; set; }

    public int? Touserid { get; set; }

    public string? Reason { get; set; }

    public string? Status { get; set; }

    public string? Resolution { get; set; }

    public DateTime? Createdat { get; set; }

    public DateTime? Updatedat { get; set; }

    public virtual User? Fromuser { get; set; }

    public virtual User? Touser { get; set; }
}
