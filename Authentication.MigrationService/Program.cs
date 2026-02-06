using Authentication.API.DAL;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using ProjetWeb.Shared.Migration;

var builder = Host.CreateApplicationBuilder(args);

builder.AddServiceDefaults();
builder.AddSqlServerDbContext<AuthDbContext>("authdb");

builder.Services.AddHostedService<SqlServerMigrationWorker<AuthDbContext>>();

var app = builder.Build();
app.Run();