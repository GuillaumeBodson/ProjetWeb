using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Polly;
using Polly.Retry;

namespace ProjetWeb.Shared.Migration;

public class SqlServerMigrationWorker<TDbContext>(IOptions<MigrationOptions> migrationOptions, IServiceProvider serviceProvider, IHostApplicationLifetime lifetime, ILogger<SqlServerMigrationWorker<TDbContext>> logger) : BackgroundService
where TDbContext : DbContext
{
    private readonly MigrationOptions _migrationOptions = migrationOptions?.Value ?? new MigrationOptions();

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
                    logger.LogWarning("Database not ready, retrying in {Delay}...", args.RetryDelay);
                    return ValueTask.CompletedTask;
                }
            })
            .Build();

        await pipeline.ExecuteAsync(async token =>
        {
            logger.LogInformation("Starting database migration...");

            await using var scope = serviceProvider.CreateAsyncScope();
            var dbContext = scope.ServiceProvider.GetRequiredService<TDbContext>();

            // Ensure database is created and can connect
            var canConnect = await dbContext.Database.CanConnectAsync(token);
            if (!canConnect)
            {
                throw new InvalidOperationException($"Unable to connect to the {typeof(TDbContext).Name} database.");
            }

            var pendingMigrations = await dbContext.Database.GetPendingMigrationsAsync(token);

            if (pendingMigrations.Any())
            {
                logger.LogInformation("Applying {Count} pending migrations", pendingMigrations.Count());
                await dbContext.Database.MigrateAsync(token);
                logger.LogInformation("Migrations applied successfully");
            }
            else
            {
                logger.LogInformation("No pending migrations");
            }
        }, stoppingToken);

        if (_migrationOptions.StopAfterExecution)
        {
            lifetime.StopApplication();
        }
    }
}
