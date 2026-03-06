using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using Polly;
using Polly.Retry;
using SiteManagement.API.DAL;

namespace SiteManagement.MigrationService;

public class DataSeedWorker(
    IServiceProvider serviceProvider,
    IHostApplicationLifetime lifetime,
    IOptions<SeedingOptions> seedingOptions,
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
                var forceRecreate = seedingOptions.Value.ForceRecreate;

                if (forceRecreate)
                {
                    logger.LogWarning("ForceRecreate is enabled - dropping and recreating database...");
                    await dbContext.Database.EnsureDeletedAsync(token);
                }
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