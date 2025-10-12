using System;
using System.Collections.Generic;

namespace BE.Models;

public partial class Block
{
    public int Blockid { get; set; }

    public int? Fromuserid { get; set; }

    public int? Touserid { get; set; }

    public DateTime? Createdat { get; set; }

    public DateTime? Updatedat { get; set; }

    public virtual User? Fromuser { get; set; }

    public virtual User? Touser { get; set; }
}
