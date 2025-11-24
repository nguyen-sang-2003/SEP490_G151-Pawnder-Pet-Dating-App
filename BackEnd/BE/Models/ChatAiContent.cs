using System;
using System.Collections.Generic;

namespace BE.Models;

public partial class ChatAicontent
{
    public int ContentId { get; set; }

    public int? ChatAiid { get; set; }

    public string? Question { get; set; }

    public string? Answer { get; set; }

    public DateTime? CreatedAt { get; set; }

    public DateTime? UpdatedAt { get; set; }

    public virtual ChatAi? ChatAi { get; set; }
}
