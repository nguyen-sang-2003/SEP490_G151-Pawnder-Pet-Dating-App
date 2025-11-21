using System;
using System.Collections.Generic;

namespace BE.Models;

public partial class PaymentHistory
{
    public int HistoryId { get; set; }

    public int? UserId { get; set; }

    public string? StatusService { get; set; }

    public DateOnly? StartDate { get; set; }

    public DateOnly? EndDate { get; set; }

    public decimal? Amount { get; set; }  // Số tiền thanh toán (99,000đ cho VIP)

    public DateTime? CreatedAt { get; set; }

    public DateTime? UpdatedAt { get; set; }

    public virtual User? User { get; set; }
}
