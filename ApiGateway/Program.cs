using ProjetWeb.Shared.Extensions;


var builder = WebApplication.CreateBuilder(args);

builder.AddServiceDefaults();

// Add services to the container.


// JWT Authentication - Same config as Auth Service
builder.Services.AddJwtAuthentication();

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
