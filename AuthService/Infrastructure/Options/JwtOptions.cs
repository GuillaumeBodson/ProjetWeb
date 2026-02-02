using System.ComponentModel.DataAnnotations;

namespace Authentication.API.Infrastructure.Options;

public class JwtOptions
{
    public const string SectionName = "Jwt";

    [Required]
    [MinLength(32)]
    public required string Key { get; init; }

    [Required]
    public required string Issuer { get; init; }

    [Required]
    public required string Audience { get; init; }

    public int AccessTokenExpirationHours { get; init; } = 1;
    public int RefreshTokenExpirationDays { get; init; } = 7;
}