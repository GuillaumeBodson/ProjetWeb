using System.ComponentModel.DataAnnotations;

namespace Authentication.API.Infrastructure.Options;

public class RateLimitOptions
{
    public const string SectionName = "RateLimiting";

    public GlobalRateLimitOptions Global { get; init; } = new();
    public AuthRateLimitOptions Auth { get; init; } = new();

    [Range(1, 300)]
    public int RetryAfterSeconds { get; init; } = 60;
}

public class GlobalRateLimitOptions
{
    [Range(1, 10000)]
    public int TokenLimit { get; init; } = 100;

    [Range(1, 60)]
    public int ReplenishmentPeriodMinutes { get; init; } = 1;

    [Range(1, 10000)]
    public int TokensPerPeriod { get; init; } = 100;

    [Range(0, 100)]
    public int QueueLimit { get; init; } = 0;
}

public class AuthRateLimitOptions
{
    [Range(1, 1000)]
    public int TokenLimit { get; init; } = 10;

    [Range(1, 60)]
    public int ReplenishmentPeriodMinutes { get; init; } = 1;

    [Range(1, 1000)]
    public int TokensPerPeriod { get; init; } = 10;

    [Range(0, 100)]
    public int QueueLimit { get; init; } = 0;
}