using System.ComponentModel.DataAnnotations;

namespace Authentication.API.BL.Models;

public class RefreshTokenRequest
{
    [Required]
    public string RefreshToken { get; set; } = string.Empty;
}
