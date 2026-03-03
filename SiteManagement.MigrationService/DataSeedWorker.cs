using Microsoft.EntityFrameworkCore;
using Polly;
using Polly.Retry;
using SiteManagement.API.DAL;

namespace SiteManagement.MigrationService;

public class DataSeedWorker(
    IServiceProvider serviceProvider,
    IHostApplicationLifetime lifetime,
    ILogger<DataSeedWorker> logger) : BackgroundService
{
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        var pipeline = new ResiliencePipelineBuilder()
            .AddRetry(new RetryStrategyOptions
            {
                MaxRetryAttempts = 5,
                Delay = TimeSpan.FromSeconds(5),
                BackoffType = DelayBackoffType.Exponential,
                OnRetry = args =>
                {
                    logger.LogWarning("Seeding attempt failed, retrying in {Delay}...", args.RetryDelay);
                    return ValueTask.CompletedTask;
                }
            })
            .Build();

        await pipeline.ExecuteAsync(async token =>
        {
            logger.LogInformation("Starting data seeding for SiteManagementDbContext...");

            await using var scope = serviceProvider.CreateAsyncScope();
            var dbContext = scope.ServiceProvider.GetRequiredService<SiteManagementDbContext>();


            try
            {
                await dbContext.Database.MigrateAsync(token);
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Database migration failed.");
                throw;
            }

            var seeder = scope.ServiceProvider.GetRequiredService<DataSeeder>();
            await seeder.SeedAsync();

            logger.LogInformation("Data seeding completed successfully");
        }, stoppingToken);

        lifetime.StopApplication();
    }
}