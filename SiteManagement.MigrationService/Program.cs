using SiteManagement.API.DAL;
using ProjetWeb.Shared.Migration;
using SiteManagement.MigrationService;

var builder = Host.CreateApplicationBuilder(args);

builder.AddServiceDefaults();
builder.AddSqlServerDbContext<SiteManagementDbContext>("sitemanagementdb");

builder.Services.AddScoped<DataSeeder>();

// Register workers - DataSeedWorker checks for pending migrations before seeding
builder.Services.AddHostedService<SqlServerMigrationWorker<SiteManagementDbContext>>();
builder.Services.AddHostedService<DataSeedWorker>();

var app = builder.Build();
app.Run();