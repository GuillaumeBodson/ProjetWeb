using System.ComponentModel.DataAnnotations;

namespace AuthService.BL.Models;

public class RefreshTokenRequest
{
    [Required]
    public string RefreshToken { get; set; } = string.Empty;
}
