using System;
using System.Collections.Generic;

namespace BE.Models;

public partial class Role
{
    public int Roleid { get; set; }

    public string Rolename { get; set; } = null!;

    public DateTime? Createdat { get; set; }

    public DateTime? Updatedat { get; set; }

    public virtual ICollection<User> Users { get; set; } = new List<User>();
}
