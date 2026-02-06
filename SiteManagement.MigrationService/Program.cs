using ProjetWeb.Shared.Migration;
using SiteManagement.API.DAL;
using SiteManagement.MigrationService;

var builder = Host.CreateApplicationBuilder(args);

builder.AddServiceDefaults();
builder.AddSqlServerDbContext<SiteManagementDbContext>("sitemanagementdb");

builder.Services.AddOptions<SeedingOptions>().BindConfiguration(SeedingOptions.Key);

builder.Services.AddScoped<DataSeeder>();

// Register workers - DataSeedWorker checks for pending migrations before seeding
builder.Services.AddHostedService<SqlServerMigrationWorker<SiteManagementDbContext>>();
builder.Services.AddHostedService<DataSeedWorker>();

var app = builder.Build();
app.Run();
