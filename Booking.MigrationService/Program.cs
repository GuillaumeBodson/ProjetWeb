using Booking.API.DAL;
using ProjetWeb.Shared.Migration;

var builder = Host.CreateApplicationBuilder(args);

builder.AddServiceDefaults();
builder.AddSqlServerDbContext<BookingDbContext>("bookingdb");

builder.Services.AddOptions<MigrationOptions>().BindConfiguration(MigrationOptions.Key);

// Register migration worker
builder.Services.AddHostedService<SqlServerMigrationWorker<BookingDbContext>>();

var app = builder.Build();
app.Run();

