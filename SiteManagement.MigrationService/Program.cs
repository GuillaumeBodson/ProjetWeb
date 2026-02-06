using SiteManagement.API.DAL;
using ProjetWeb.Shared.Migration;

var builder = Host.CreateApplicationBuilder(args);

builder.AddServiceDefaults();
builder.AddSqlServerDbContext<SiteManagementDbContext>("sitemanagementdb");

builder.Services.AddHostedService<SqlServerMigrationWorker<SiteManagementDbContext>>();

var app = builder.Build();
app.Run();
