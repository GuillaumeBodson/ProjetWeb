using System.ComponentModel.DataAnnotations;

namespace ProjetWeb.Shared.Options;

/// <summary>
/// JWT configuration options (use with Options pattern).
/// </summary>
public class JwtOptions
{
    public const string SectionName = "Jwt";

    [Required]
    public required string Key { get; init; }

    [Required]
    public required string Issuer { get; init; }

    [Required]
    public required string Audience { get; init; }

    public int AccessTokenExpirationHours { get; init; } = 1;
    public int RefreshTokenExpirationDays { get; init; } = 7;

}