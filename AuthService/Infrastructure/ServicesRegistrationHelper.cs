using Authentication.API.Infrastructure.Options;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using ProjetWeb.Shared.Options;
using System.Text;
using System.Threading.RateLimiting;

namespace Authentication.API.Infrastructure;

public static class ServicesRegistrationHelper
{
    public static IServiceCollection AddRateLimiterPolicies(this IServiceCollection services)
    {
        services.AddRateLimiter(options =>
        {
            options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
        });

        services.AddOptions<RateLimiterOptions>()
            .Configure<IOptions<RateLimitOptions>>((rateLimiterOptions, rateLimitOptions) =>
            {
                var config = rateLimitOptions.Value;

                // Global policy for general endpoints
                rateLimiterOptions.GlobalLimiter = PartitionedRateLimiter.Create<HttpContext, string>(context =>
                    RateLimitPartition.GetTokenBucketLimiter(
                        partitionKey: context.Connection.RemoteIpAddress?.ToString() ?? "unknown",
                        factory: _ => new TokenBucketRateLimiterOptions
                        {
                            TokenLimit = config.Global.TokenLimit,
                            ReplenishmentPeriod = TimeSpan.FromMinutes(config.Global.ReplenishmentPeriodMinutes),
                            TokensPerPeriod = config.Global.TokensPerPeriod,
                            AutoReplenishment = true,
                            QueueProcessingOrder = QueueProcessingOrder.OldestFirst,
                            QueueLimit = config.Global.QueueLimit
                        }));

                // Strict policy for authentication endpoints (login, register)
                rateLimiterOptions.AddPolicy("auth", context =>
                    RateLimitPartition.GetTokenBucketLimiter(
                        partitionKey: context.Connection.RemoteIpAddress,
                        factory: _ => new TokenBucketRateLimiterOptions
                        {
                            TokenLimit = config.Auth.TokenLimit,
                            ReplenishmentPeriod = TimeSpan.FromMinutes(config.Auth.ReplenishmentPeriodMinutes),
                            TokensPerPeriod = config.Auth.TokensPerPeriod,
                            AutoReplenishment = true,
                            QueueLimit = config.Auth.QueueLimit
                        }));

                rateLimiterOptions.OnRejected = async (context, cancellationToken) =>
                {
                    context.HttpContext.Response.Headers.RetryAfter = config.RetryAfterSeconds.ToString();

                    await context.HttpContext.Response.WriteAsJsonAsync(new ProblemDetails
                    {
                        Status = StatusCodes.Status429TooManyRequests,
                        Title = "Too Many Requests",
                        Detail = "Rate limit exceeded. Please try again later."
                    }, cancellationToken);
                };
            });

        return services;
    }

    public static IServiceCollection RegisterOptions(this IServiceCollection services)
    {
        services.AddOptions<RateLimitOptions>()
            .BindConfiguration(RateLimitOptions.SectionName)
            .ValidateDataAnnotations()
            .ValidateOnStart();

        return services;
    }
}
