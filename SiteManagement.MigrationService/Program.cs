using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using SiteManagement.API.DAL;
using SiteManagement.MigrationService;

var builder = Host.CreateApplicationBuilder(args);

builder.AddServiceDefaults();
builder.AddSqlServerDbContext<SiteManagementDbContext>("sitemanagementdb");

builder.Services.AddHostedService<MigrationWorker>();

var app = builder.Build();
app.Run();
