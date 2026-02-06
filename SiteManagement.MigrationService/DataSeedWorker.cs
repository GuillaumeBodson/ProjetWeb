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
                MaxRetryAttempts = 3,
                Delay = TimeSpan.FromSeconds(2),
                BackoffType = DelayBackoffType.Linear,
                OnRetry = args =>
                {
                    logger.LogWarning("Seeding failed, retrying in {Delay}...", args.RetryDelay);
                    return ValueTask.CompletedTask;
                }
            })
            .Build();

        await pipeline.ExecuteAsync(async token =>
        {
            logger.LogInformation("Starting data seeding...");

            await using var scope = serviceProvider.CreateAsyncScope();
            var dbContext = scope.ServiceProvider.GetRequiredService<SiteManagementDbContext>();

            // Ensure database is ready
            var canConnect = await dbContext.Database.CanConnectAsync(token);
            if (!canConnect)
            {
                throw new InvalidOperationException("Unable to connect to the site management database.");
            }

            // Ensure all migrations are applied before seeding
            var pendingMigrations = await dbContext.Database.GetPendingMigrationsAsync(token);
            if (pendingMigrations.Any())
            {
                logger.LogWarning("Pending migrations detected. Waiting for migrations to complete...");
                throw new InvalidOperationException("Database migrations are not yet complete. Seeding cannot proceed until migrations complete.");
            }

            // Run seeder
            var seeder = scope.ServiceProvider.GetRequiredService<DataSeeder>();
            await seeder.SeedAsync();

            logger.LogInformation("Data seeding completed successfully");

        }, stoppingToken);

        lifetime.StopApplication();
    }
}