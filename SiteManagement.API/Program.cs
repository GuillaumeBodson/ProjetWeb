using FluentValidation;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ProjetWeb.Shared.Exceptions;
using ProjetWeb.Shared.Extensions;
using SharpGrip.FluentValidation.AutoValidation.Mvc.Extensions;
using SiteManagement.API.BL.Services;
using SiteManagement.API.BL.Services.Abstractions;
using SiteManagement.API.DAL;
using System.Text.Json.Serialization;
using ToolBox.EntityFramework.Filters;

var builder = WebApplication.CreateBuilder(args);

// IMPORTANT: Call this first
builder.AddServiceDefaults();

// Configure JSON options to serialize enums as strings
builder.Services.ConfigureHttpJsonOptions(options =>
{
    options.SerializerOptions.Converters.Add(new JsonStringEnumConverter());
    // Ensure numbers are serialized as numbers, not strings
    options.SerializerOptions.NumberHandling = JsonNumberHandling.Strict;
});

// Database
builder.AddSqlServerDbContext<SiteManagementDbContext>("sitemanagementdb");

// Add FluentValidation
builder.Services.AddFilterValidators();
builder.Services.AddValidatorsFromAssemblyContaining<Program>();
builder.Services.AddFluentValidationAutoValidation();

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
{
    options.Filters.Add(new ProducesDefaultResponseTypeAttribute(typeof(ProblemDetails)));
    options.Filters.Add(new ProducesResponseTypeAttribute(typeof(ProblemDetails), StatusCodes.Status500InternalServerError));
})
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter());
        options.JsonSerializerOptions.NumberHandling = JsonNumberHandling.Strict;

        // Allow case-insensitive property matching
        options.JsonSerializerOptions.PropertyNameCaseInsensitive = true;

        // Handle null values gracefully
        // options.JsonSerializerOptions.DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull;
    });

// OpenAPI/Swagger
builder.Services.AddOpenApi();

var app = builder.Build();

// Map Aspire health check endpoints
app.MapDefaultEndpoints();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi().AllowAnonymous();
}

app.UseExceptionHandler();

app.UseHttpsRedirection();

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.Run();
