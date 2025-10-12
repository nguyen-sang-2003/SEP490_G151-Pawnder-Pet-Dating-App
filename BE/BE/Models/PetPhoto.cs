using System;
using System.Collections.Generic;

namespace BE.Models;

public partial class Petphoto
{
    public int Photoid { get; set; }

    public int? Petid { get; set; }

    public string? Imagepeturl { get; set; }

    public DateTime? Createdat { get; set; }

    public DateTime? Updatedat { get; set; }

    public virtual Pet? Pet { get; set; }
}
