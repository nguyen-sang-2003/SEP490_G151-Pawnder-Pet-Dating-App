using System;
using System.Collections.Generic;

namespace BE.Models;

public partial class User
{
    public int Userid { get; set; }

    public int? Roleid { get; set; }

    public int? Userstatusid { get; set; }

    public string? Fullname { get; set; }

    public string? Gender { get; set; }

    public string Email { get; set; } = null!;

    public string Passwordhash { get; set; } = null!;

    public string? Tokenjwt { get; set; }

    public DateTime? Createdat { get; set; }

    public DateTime? Updatedat { get; set; }

    public virtual ICollection<Block> BlockFromusers { get; set; } = new List<Block>();

    public virtual ICollection<Block> BlockTousers { get; set; } = new List<Block>();

    public virtual ICollection<Expertconfirmation> ExpertconfirmationExperts { get; set; } = new List<Expertconfirmation>();

    public virtual ICollection<Expertconfirmation> ExpertconfirmationUserrequests { get; set; } = new List<Expertconfirmation>();

    public virtual ICollection<Location> Locations { get; set; } = new List<Location>();

    public virtual ICollection<Message> Messages { get; set; } = new List<Message>();

    public virtual ICollection<Notification> Notifications { get; set; } = new List<Notification>();

    public virtual ICollection<Paymenthistory> Paymenthistories { get; set; } = new List<Paymenthistory>();

    public virtual ICollection<Pet> Pets { get; set; } = new List<Pet>();

    public virtual ICollection<Report> ReportFromusers { get; set; } = new List<Report>();

    public virtual ICollection<Report> ReportTousers { get; set; } = new List<Report>();

    public virtual ICollection<Requestmatch> RequestmatchFromusers { get; set; } = new List<Requestmatch>();

    public virtual ICollection<Requestmatch> RequestmatchTousers { get; set; } = new List<Requestmatch>();

    public virtual Role? Role { get; set; }

    public virtual ICollection<Userpreference> Userpreferences { get; set; } = new List<Userpreference>();

    public virtual Userstatus? Userstatus { get; set; }
}
