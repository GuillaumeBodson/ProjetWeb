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
            logger.LogInformation("Starting database migration for {DbContext}...", typeof(TDbContext).Name);

            await using var scope = serviceProvider.CreateAsyncScope();
            var dbContext = scope.ServiceProvider.GetRequiredService<TDbContext>();

            // MigrateAsync handles everything:
            //   - creates the database if it does not exist (via master)
            //   - applies all pending migrations
            //   - is a no-op when already up to date
            await dbContext.Database.MigrateAsync(token);

            logger.LogInformation("Migration completed successfully for {DbContext}", typeof(TDbContext).Name);
        }, stoppingToken);

        if (_migrationOptions.StopAfterExecution)
        {
            lifetime.StopApplication();
        }
    }
}
