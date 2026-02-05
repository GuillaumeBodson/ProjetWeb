using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ProjetWeb.Shared.Exceptions;
using ProjetWeb.Shared.Extensions;
using SiteManagement.API.BL.Services;
using SiteManagement.API.BL.Services.Abstractions;
using SiteManagement.API.DAL;

var builder = WebApplication.CreateBuilder(args);

// IMPORTANT: Call this first
builder.AddServiceDefaults();

// Database
builder.AddSqlServerDbContext<SiteManagementDbContext>("sitemanagementdb");

// Register services
builder.Services.AddScoped<ISiteService, SiteService>();

// Exception handling
builder.Services.AddExceptionHandler<GlobalExceptionHandler>();
builder.Services.AddProblemDetails();

// JWT Authentication (same config as Gateway)
builder.Services.AddJwtAuthentication();

// Authorization with FallbackPolicy (secure by default)
builder.Services.AddAuthorizationBuilder()
.SetFallbackPolicy(new AuthorizationPolicyBuilder()
.RequireAuthenticatedUser()
.Build());

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

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.Run();
