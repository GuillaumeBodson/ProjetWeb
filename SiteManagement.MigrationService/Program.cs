using ProjetWeb.Shared.Migration;
using SiteManagement.API.DAL;
using SiteManagement.MigrationService;

var builder = Host.CreateApplicationBuilder(args);

builder.AddServiceDefaults();
builder.AddSqlServerDbContext<SiteManagementDbContext>("sitemanagementdb");

builder.Services.AddOptions<SeedingOptions>().BindConfiguration(SeedingOptions.Key);
builder.Services.AddOptions<MigrationOptions>().BindConfiguration(MigrationOptions.Key);

builder.Services.AddScoped<DataSeeder>();

// DataSeedWorker handles both migration (MigrateAsync) and seeding in sequence.
// SqlServerMigrationWorker is intentionally not registered here to avoid
// a race condition where StopApplication() is called before seeding completes.
builder.Services.AddHostedService<DataSeedWorker>();

var app = builder.Build();
app.Run();
