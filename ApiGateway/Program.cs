using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;


var builder = WebApplication.CreateBuilder(args);

builder.AddServiceDefaults();

// Add services to the container.


// JWT Authentication - Same config as Auth Service
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = builder.Configuration["Jwt:Issuer"],
            ValidAudience = builder.Configuration["Jwt:Audience"],
            IssuerSigningKey = new SymmetricSecurityKey(
                Encoding.UTF8.GetBytes(builder.Configuration["Jwt:Key"]!)),
            ClockSkew = TimeSpan.Zero
        };
    });

// Authorization policies
builder.Services.AddAuthorizationBuilder()
                             // Authorization policies
                             .AddPolicy("authenticated", policy =>
        policy.RequireAuthenticatedUser())
                             // Authorization policies
                             .AddPolicy("admin", policy =>
        policy.RequireRole("Admin"));

// YARP
builder.Services.AddReverseProxy()
    .LoadFromConfig(builder.Configuration.GetSection("ReverseProxy"))
    .AddServiceDiscoveryDestinationResolver();

// CORS for Angular
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy.WithOrigins("http://localhost:4200")
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});

builder.Services.AddControllers();
// Learn more about configuring OpenAPI at https://aka.ms/aspnet/openapi
builder.Services.AddOpenApi();

var app = builder.Build();

app.MapDefaultEndpoints();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

// Handle CORS preflight requests BEFORE any redirects
// This middleware short-circuits OPTIONS requests with proper CORS headers
app.Use(async (context, next) =>
{
    if (context.Request.Method == HttpMethods.Options)
    {
        var origin = context.Request.Headers.Origin.ToString();
        if (origin is "http://localhost:4200" or "https://localhost:4200")
        {
            context.Response.Headers.AccessControlAllowOrigin = origin;
            context.Response.Headers.AccessControlAllowMethods = "GET, POST, PUT, DELETE, OPTIONS";
            context.Response.Headers.AccessControlAllowHeaders = "Content-Type, Authorization";
            context.Response.Headers.AccessControlAllowCredentials = "true";
            context.Response.StatusCode = StatusCodes.Status204NoContent;
            return; // Short-circuit - don't continue to HTTPS redirect
        }
    }
    await next();
});


app.UseCors();


// Only redirect to HTTPS when not running in a container (to allow HTTP-only container traffic)
if (!app.Environment.IsDevelopment() && string.IsNullOrEmpty(Environment.GetEnvironmentVariable("DOTNET_RUNNING_IN_CONTAINER")))
{
    app.UseHttpsRedirection();
}

app.UseAuthentication(); 
app.UseAuthorization();

app.MapControllers();

app.MapReverseProxy();

app.Run();
