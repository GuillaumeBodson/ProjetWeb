using Authentication.API.BL.Services;
using Authentication.API.BL.Services.Abstractions;
using Authentication.API.DAL;
using Authentication.API.Infrastructure;
using Microsoft.AspNetCore.HttpOverrides;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using static Authentication.API.Infrastructure.ServicesRegistrationHelper;

var builder = WebApplication.CreateBuilder(args);

builder.AddServiceDefaults();

// Database
builder.AddSqlServerDbContext<AuthDbContext>("authdb");


builder.Services.RegisterOptions();

// Add services to the container.
builder.Services.AddScoped<ITokenService, TokenService>();
builder.Services.AddScoped<IAuthService, AuthService>();

builder.Services.AddExceptionHandler<GlobalExceptionHandler>();
builder.Services.AddProblemDetails();

builder.Services.Configure<ForwardedHeadersOptions>(options =>
{
    options.ForwardedHeaders = ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedProto;
    options.KnownIPNetworks.Clear();
    options.KnownProxies.Clear();
});


// Rate Limiting Configuration
builder.Services.AddRateLimiterPolicies();


builder.Services.AddControllers(options => 
    options.Filters.Add(new ProducesDefaultResponseTypeAttribute(typeof(ProblemDetails))));


// JWT Authentication
builder.Services.AddJWTAuthentication();


// Learn more about configuring OpenAPI at https://aka.ms/aspnet/openapi
builder.Services.AddOpenApi();

var app = builder.Build();

app.MapDefaultEndpoints();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}
app.UseForwardedHeaders();

app.UseExceptionHandler();

app.UseRateLimiter();
// Only use HTTPS redirect in production and when not behind a proxy
if (!app.Environment.IsDevelopment())
{
    app.UseHttpsRedirection();
}

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.Run();
