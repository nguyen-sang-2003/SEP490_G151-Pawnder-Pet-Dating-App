using System;
using System.Collections.Generic;

namespace BE.Models;

public partial class Paymenthistory
{
    public int Historyid { get; set; }

    public int? Userid { get; set; }

    public string? Statusservice { get; set; }

    public DateOnly? Startdate { get; set; }

    public DateOnly? Enddate { get; set; }

    public DateTime? Createdat { get; set; }

    public DateTime? Updatedat { get; set; }

    public virtual User? User { get; set; }
}
