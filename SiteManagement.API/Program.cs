using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.IdentityModel.Tokens;
using SiteManagement.API.BL.Services;
using SiteManagement.API.BL.Services.Abstractions;
using SiteManagement.API.DAL;
using SiteManagement.API.Infrastructure;
using System.Text;

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
var jwtKey = builder.Configuration["Jwt:Key"];
var jwtIssuer = builder.Configuration["Jwt:Issuer"];
var jwtAudience = builder.Configuration["Jwt:Audience"];

if (string.IsNullOrEmpty(jwtKey) || string.IsNullOrEmpty(jwtIssuer) || string.IsNullOrEmpty(jwtAudience))
{
    throw new InvalidOperationException("JWT configuration is incomplete. Ensure Jwt:Key, Jwt:Issuer, and Jwt:Audience are configured.");
}
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = jwtKey,
            ValidAudience = jwtIssuer,
            IssuerSigningKey = new SymmetricSecurityKey(
                Encoding.UTF8.GetBytes(jwtAudience)),
            ClockSkew = TimeSpan.Zero
        };
    });

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
