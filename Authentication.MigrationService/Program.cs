using Authentication.API.DAL;
using Authentication.MigrationService;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;

var builder = Host.CreateApplicationBuilder(args);

builder.AddServiceDefaults();
builder.AddSqlServerDbContext<AuthDbContext>("authdb");

builder.Services.AddHostedService<MigrationWorker>();

var app = builder.Build();
app.Run();