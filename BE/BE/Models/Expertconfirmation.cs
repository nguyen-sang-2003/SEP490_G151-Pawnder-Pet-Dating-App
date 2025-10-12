using System;
using System.Collections.Generic;

namespace BE.Models;

public partial class Expertconfirmation
{
    public int Confirmationid { get; set; }

    public int? Userrequestid { get; set; }

    public int? Expertid { get; set; }

    public string? Contentconfirmation { get; set; }

    public bool? Contentaccurate { get; set; }

    public string? Status { get; set; }

    public DateTime? Createdat { get; set; }

    public DateTime? Updatedat { get; set; }

    public virtual User? Expert { get; set; }

    public virtual User? Userrequest { get; set; }
}
