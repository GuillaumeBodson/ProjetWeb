using Microsoft.AspNetCore.Mvc;
using SiteManagement.API.BL.Services;
using SiteManagement.API.BL.Services.Abstractions;
using SiteManagement.API.DAL;
using SiteManagement.API.Infrastructure;

var builder = WebApplication.CreateBuilder(args);

// IMPORTANT: Call this first
builder.AddServiceDefaults();

// Database
builder.AddSqlServerDbContext<SiteManagementDbContext>("sitedb");

// Register services
builder.Services.AddScoped<ISiteService, SiteService>();

// Exception handling
builder.Services.AddExceptionHandler<GlobalExceptionHandler>();
builder.Services.AddProblemDetails();

// Controllers with ProblemDetails response type
builder.Services.AddControllers(options => 
    options.Filters.Add(new ProducesDefaultResponseTypeAttribute(typeof(ProblemDetails))));

// OpenAPI/Swagger
builder.Services.AddOpenApi();

var app = builder.Build();

// Map Aspire health check endpoints
app.MapDefaultEndpoints();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseExceptionHandler();

app.UseHttpsRedirection();

app.UseAuthorization();

app.MapControllers();

app.Run();
