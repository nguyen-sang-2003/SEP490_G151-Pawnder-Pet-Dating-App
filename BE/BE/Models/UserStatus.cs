using System;
using System.Collections.Generic;

namespace BE.Models;

public partial class UserStatus
{
    public Guid UserStatusId { get; set; }

    public string UserStatusName { get; set; } = null!;

    public DateTime? CreatedAt { get; set; }

    public DateTime? UpdatedAt { get; set; }

    public virtual ICollection<User> Users { get; set; } = new List<User>();
}
