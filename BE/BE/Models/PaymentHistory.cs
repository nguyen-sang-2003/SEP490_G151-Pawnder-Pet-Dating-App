using System;
using System.Collections.Generic;

namespace BE.Models;

public partial class PaymentHistory
{
    public Guid HistoryId { get; set; }

    public Guid? UserId { get; set; }

    public string? StatusService { get; set; }

    public DateOnly? StartDate { get; set; }

    public DateOnly? EndDate { get; set; }

    public DateTime? CreatedAt { get; set; }

    public DateTime? UpdatedAt { get; set; }

    public virtual User? User { get; set; }
}
