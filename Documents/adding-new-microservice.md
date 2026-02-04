# Adding a New Microservice to the Architecture

This guide provides step-by-step instructions for adding a new microservice to the ProjetWeb architecture, following the established patterns from `AuthService` and the YARP API Gateway.

## Overview

Our microservices architecture consists of:
- **Individual microservices** (e.g., AuthService, ProductService)
- **API Gateway** (YARP) - Single entry point
- **SQL Server** - With database-per-service pattern
- **Migration services** - Separate projects for database migrations
- **Aspire AppHost** - Orchestration and service discovery

---

## Step 1: Create the Microservice Project

```powershell
# From solution root (C:\src\ephec\ProjetWeb)
cd C:\src\ephec\ProjetWeb

# Create the new service (example: ProductService)
dotnet new webapi -n ProductService -o ProductService

# Add to solution
dotnet sln add ProductService/ProductService.csproj

# Reference ServiceDefaults
dotnet add ProductService/ProductService.csproj reference ProjetWeb.ServiceDefaults/ProjetWeb.ServiceDefaults.csproj
```

---

## Step 2: Structure the Project

Follow the layered architecture pattern used in `AuthService`:

```
ProductService/
├── Controllers/              # API endpoints
│   └── ProductController.cs
├── BL/                      # Business Logic
│   ├── Models/
│   │   ├── ProductRequest.cs
│   │   ├── ProductResponse.cs
│   │   └── CreateProductRequest.cs
│   └── Services/
│       ├── Abstractions/
│       │   └── IProductService.cs
│       └── ProductService.cs
├── DAL/                     # Data Access Layer
│   ├── Entities/
│   │   └── Product.cs
│   ├── Configurations/      # EF Core configurations
│   │   └── ProductConfiguration.cs
│   └── ProductDbContext.cs
├── Infrastructure/
│   ├── GlobalExceptionHandler.cs
│   ├── ServicesRegistrationHelper.cs
│   └── Options/            # Strongly-typed configuration
└── Program.cs
```

---

## Step 3: Configure Program.cs

```csharp ProductService\Program.cs
using Microsoft.AspNetCore.Mvc;
using ProductService.BL.Services;
using ProductService.BL.Services.Abstractions;
using ProductService.DAL;
using ProductService.Infrastructure;

var builder = WebApplication.CreateBuilder(args);

// IMPORTANT: Call this first
builder.AddServiceDefaults();

// Database (if service needs its own database)
builder.AddSqlServerDbContext<ProductDbContext>("productdb");

// Register services
builder.Services.AddScoped<IProductService, ProductService.BL.Services.ProductService>();

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
```

---

## Step 4: Create DbContext (If Database Needed)

```csharp ProductService\DAL\ProductDbContext.cs
using Microsoft.EntityFrameworkCore;
using ProductService.DAL.Entities;

namespace ProductService.DAL;

public class ProductDbContext : DbContext
{
    public ProductDbContext(DbContextOptions<ProductDbContext> options)
        : base(options)
    {
    }

    public DbSet<Product> Products { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(ProductDbContext).Assembly);
    }
}
```

### Entity Configuration

```csharp ProductService\DAL\Configurations\ProductConfiguration.cs
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using ProductService.DAL.Entities;

namespace ProductService.DAL.Configurations;

public class ProductConfiguration : IEntityTypeConfiguration<Product>
{
    public void Configure(EntityTypeBuilder<Product> builder)
    {
        builder.HasKey(p => p.Id);

        builder.Property(p => p.Name)
            .IsRequired()
            .HasMaxLength(200);

        builder.Property(p => p.Price)
            .HasColumnType("decimal(18,2)");

        builder.HasIndex(p => p.Name);
    }
}
```

### Design-Time Factory for Migrations

```csharp ProductService\DAL\ProductDbContextFactory.cs
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;

namespace ProductService.DAL;

/// <summary>
/// Factory for creating ProductDbContext during design-time operations (migrations).
/// </summary>
public class ProductDbContextFactory : IDesignTimeDbContextFactory<ProductDbContext>
{
    public ProductDbContext CreateDbContext(string[] args)
    {
        var optionsBuilder = new DbContextOptionsBuilder<ProductDbContext>();
        
        // Use a dummy connection string for migration generation only
        optionsBuilder.UseSqlServer("Server=.;Database=ProductDb_Design;Trusted_Connection=True;TrustServerCertificate=True");

        return new ProductDbContext(optionsBuilder.Options);
    }
}
```

---

## Step 5: Create Migration Service

### 5.1 Create the Project

```powershell
dotnet new worker -n ProductService.MigrationService -o ProductService.MigrationService
dotnet sln add ProductService.MigrationService/ProductService.MigrationService.csproj
dotnet add ProductService.MigrationService reference ProductService/ProductService.csproj
dotnet add ProductService.MigrationService reference ProjetWeb.ServiceDefaults/ProjetWeb.ServiceDefaults.csproj
dotnet add ProductService.MigrationService package Polly
```

### 5.2 Program.cs

```csharp ProductService.MigrationService\Program.cs
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using ProductService.DAL;
using ProductService.MigrationService;

var builder = Host.CreateApplicationBuilder(args);

builder.AddServiceDefaults();
builder.AddSqlServerDbContext<ProductDbContext>("productdb");

builder.Services.AddHostedService<MigrationWorker>();

var app = builder.Build();
app.Run();
```

### 5.3 MigrationWorker.cs

```csharp ProductService.MigrationService\MigrationWorker.cs
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Polly;
using Polly.Retry;
using ProductService.DAL;

namespace ProductService.MigrationService;

public class MigrationWorker(
    IServiceProvider serviceProvider,
    IHostApplicationLifetime lifetime,
    ILogger<MigrationWorker> logger) : BackgroundService
{
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        // Initial delay to let SQL Server fully initialize
        await Task.Delay(TimeSpan.FromSeconds(15), stoppingToken);

        var pipeline = new ResiliencePipelineBuilder()
            .AddRetry(new RetryStrategyOptions
            {
                MaxRetryAttempts = 10,
                Delay = TimeSpan.FromSeconds(5),
                BackoffType = DelayBackoffType.Exponential,
                OnRetry = args =>
                {
                    logger.LogWarning("Database not ready, retrying in {Delay}...", args.RetryDelay);
                    return ValueTask.CompletedTask;
                }
            })
            .Build();

        await pipeline.ExecuteAsync(async token =>
        {
            logger.LogInformation("Starting database migration...");

            await using var scope = serviceProvider.CreateAsyncScope();
            var dbContext = scope.ServiceProvider.GetRequiredService<ProductDbContext>();

            // Ensure database is created and can connect
            await dbContext.Database.CanConnectAsync(token);

            var pendingMigrations = await dbContext.Database.GetPendingMigrationsAsync(token);

            if (pendingMigrations.Any())
            {
                logger.LogInformation("Applying {Count} pending migrations", pendingMigrations.Count());
                await dbContext.Database.MigrateAsync(token);
                logger.LogInformation("Migrations applied successfully");
            }
            else
            {
                logger.LogInformation("No pending migrations");
            }
        }, stoppingToken);

        lifetime.StopApplication();
    }
}
```

---

## Step 6: Create EF Core Migrations

```powershell
# Install EF Core tools globally (if not already)
dotnet tool install --global dotnet-ef

# Add Design package to service project
dotnet add ProductService package Microsoft.EntityFrameworkCore.Design

# Create initial migration
dotnet ef migrations add InitialCreate --project ProductService --startup-project ProductService

# After model changes, create additional migrations
dotnet ef migrations add AddProductDescription --project ProductService --startup-project ProductService
```

---

## Step 7: Add to AppHost.cs

```csharp ProjetWeb.AppHost\AppHost.cs
var builder = DistributedApplication.CreateBuilder(args);

// Add SQL Server with a dedicated database for auth
var sqlServer = builder.AddSqlServer("sql")
    .WithImageTag("2025-latest") 
    .WithDataVolume("authservice-sqldata")
    .WithEndpoint("tcp", endpoint =>
    {
        endpoint.Port = 14330;  // Fixed external port for DB access
        endpoint.TargetPort = 1433;
    });

// Databases (database-per-service pattern)
var authDb = sqlServer.AddDatabase("authdb");
var productDb = sqlServer.AddDatabase("productdb");  // NEW

// Auth migration service
var authMigrationService = builder.AddProject<Projects.Authentication_MigrationService>("auth-migrations")
    .WithReference(authDb)
    .WaitFor(authDb);

// Product migration service - NEW
var productMigrationService = builder.AddProject<Projects.ProductService_MigrationService>("product-migrations")
    .WithReference(productDb)
    .WaitFor(productDb);

// Auth API
var authApi = builder.AddProject<Projects.Authentication_API>("authservice")
    .WithReference(authDb)
    .WaitFor(authDb)
    .WaitForCompletion(authMigrationService);

// Product API - NEW
var productApi = builder.AddProject<Projects.ProductService>("productservice")
    .WithReference(productDb)
    .WaitFor(productDb)
    .WaitForCompletion(productMigrationService)
    .WithHttpEndpoint(port: 5002, name: "http");  // Fixed port

// API Gateway with references to all backend services
var apiGateway = builder.AddProject<Projects.ApiGateway>("apigateway")
    .WithReference(authApi)
    .WithReference(productApi)  // NEW: Add reference
    .WaitFor(authApi)
    .WaitFor(productApi)        // NEW: Wait for product service
    .WithHttpEndpoint(port: 5000, name: "http");

// Frontend
var frontend = builder.AddJavaScriptApp("frontend", "../ProjetWeb.Frontend", "start")
    .WithReference(apiGateway)
    .WaitFor(apiGateway)
    .WithHttpEndpoint(env: "PORT")
    .WithExternalHttpEndpoints();

builder.Build().Run();
```

---

## Step 8: Add Project Reference to AppHost

```xml ProjetWeb.AppHost\ProjetWeb.AppHost.csproj
<ItemGroup>
  <ProjectReference Include="..\ApiGateway\ApiGateway.csproj" />
  <ProjectReference Include="..\AuthService\Authentication.API.csproj" />
  <ProjectReference Include="..\Authentication.MigrationService\Authentication.MigrationService.csproj" />
  <ProjectReference Include="..\ProductService\ProductService.csproj" />
  <ProjectReference Include="..\ProductService.MigrationService\ProductService.MigrationService.csproj" />
  <ProjectReference Include="..\ProjetWeb.ServiceDefaults\ProjetWeb.ServiceDefaults.csproj" />
</ItemGroup>
```

---

## Step 9: Configure YARP Routes in API Gateway

Add routing configuration to `ApiGateway/appsettings.json`:

```json ApiGateway\appsettings.json
{
  "ReverseProxy": {
    "Routes": {
      "auth-route": {
        "ClusterId": "auth-cluster",
        "Match": {
          "Path": "/api/auth/{**catch-all}"
        }
      },
      "product-route": {
        "ClusterId": "product-cluster",
        "Match": {
          "Path": "/api/products/{**catch-all}"
        },
        "AuthorizationPolicy": "authenticated"
      }
    },
    "Clusters": {
      "auth-cluster": {
        "Destinations": {
          "auth-destination": {
            "Address": "http://authservice"
          }
        }
      },
      "product-cluster": {
        "Destinations": {
          "product-destination": {
            "Address": "http://productservice"
          }
        }
      }
    }
  }
}
```

### Route Configuration Patterns

| Pattern | Purpose | Example |
|---------|---------|---------|
| `/api/{service}/{**catch-all}` | Route all paths to service | `/api/products/1` → ProductService |
| `AuthorizationPolicy: "authenticated"` | Require JWT token | Protected routes |
| `AuthorizationPolicy: "admin"` | Require admin role | Admin-only endpoints |
| No authorization policy | Public access | Login, register |

---

## Step 10: Create HTTP Test File

``` http ProductService\ProductService.http
# ===================================
# Product Service API Tests
# ===================================

@gateway = http://localhost:5000
@productservice = http://localhost:5002

# Get token from auth first
@token = <paste-token-from-login>

### Get all products via Gateway
GET {{gateway}}/api/products
Authorization: Bearer {{token}}

### Create product via Gateway
POST {{gateway}}/api/products
Content-Type: application/json
Authorization: Bearer {{token}}

{
    "name": "Test Product",
    "price": 99.99,
    "description": "A test product"
}

### Get product by ID
GET {{gateway}}/api/products/1
Authorization: Bearer {{token}}

### Update product
PUT {{gateway}}/api/products/1
Content-Type: application/json
Authorization: Bearer {{token}}

{
    "name": "Updated Product",
    "price": 149.99,
    "description": "An updated product"
}

### Delete product
DELETE {{gateway}}/api/products/1
Authorization: Bearer {{token}}

### ===================================
### Direct to ProductService (bypassing gateway)
### ===================================

### Get all products directly
GET {{productservice}}/api/products
Authorization: Bearer {{token}}
```

---

## Step 11: Regenerate Docker Compose (Optional)

If deploying via Docker Compose:

```powershell
cd ProjetWeb.AppHost
aspirate generate --output-format compose
```

This regenerates `docker-compose.yaml` with the new service.

---

## Step 12: Create Dockerfile

```dockerfile ProductService\Dockerfile
# See https://aka.ms/customizecontainer to learn how to customize your debug container
FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS base
USER $APP_UID
WORKDIR /app
EXPOSE 8080
EXPOSE 8081

FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
ARG BUILD_CONFIGURATION=Release
WORKDIR /src
COPY ["ProductService/ProductService.csproj", "ProductService/"]
COPY ["ProjetWeb.ServiceDefaults/ProjetWeb.ServiceDefaults.csproj", "ProjetWeb.ServiceDefaults/"]
RUN dotnet restore "./ProductService/ProductService.csproj"
COPY . .
WORKDIR "/src/ProductService"
RUN dotnet build "./ProductService.csproj" -c $BUILD_CONFIGURATION -o /app/build

FROM build AS publish
ARG BUILD_CONFIGURATION=Release
RUN dotnet publish "./ProductService.csproj" -c $BUILD_CONFIGURATION -o /app/publish /p:UseAppHost=false

FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "ProductService.dll"]
```

```dockerfile ProductService.MigrationService\Dockerfile
FROM mcr.microsoft.com/dotnet/runtime:10.0 AS base
USER $APP_UID
WORKDIR /app

FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
ARG BUILD_CONFIGURATION=Release
WORKDIR /src
COPY ["ProductService.MigrationService/ProductService.MigrationService.csproj", "ProductService.MigrationService/"]
COPY ["ProductService/ProductService.csproj", "ProductService/"]
COPY ["ProjetWeb.ServiceDefaults/ProjetWeb.ServiceDefaults.csproj", "ProjetWeb.ServiceDefaults/"]
RUN dotnet restore "./ProductService.MigrationService/ProductService.MigrationService.csproj"
COPY . .
WORKDIR "/src/ProductService.MigrationService"
RUN dotnet build "./ProductService.MigrationService.csproj" -c $BUILD_CONFIGURATION -o /app/build

FROM build AS publish
ARG BUILD_CONFIGURATION=Release
RUN dotnet publish "./ProductService.MigrationService.csproj" -c $BUILD_CONFIGURATION -o /app/publish /p:UseAppHost=false

FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "ProductService.MigrationService.dll"]
```

---

## Step 13: Run and Test

### Via AppHost (F5)

1. Set `ProjetWeb.AppHost` as startup project
2. Press **F5**
3. Aspire Dashboard opens automatically
4. Verify all services are running:
   - `sql` - Running
   - `auth-migrations` - Completed
   - `product-migrations` - Completed
   - `authservice` - Running
   - `productservice` - Running
   - `apigateway` - Running
   - `frontend` - Running

### Via Docker Compose

```powershell
cd ProjetWeb.AppHost\aspirate-output

# With override for dependencies
docker compose -f docker-compose.yaml -f docker-compose.override.yaml up --build
```

---

## Checklist for New Microservice

- [ ] **Step 1**: Create service project with `dotnet new webapi`
- [ ] **Step 2**: Structure project with layered architecture (Controllers, BL, DAL, Infrastructure)
- [ ] **Step 3**: Configure `Program.cs` with `AddServiceDefaults()`
- [ ] **Step 4**: Create `DbContext` and entity configurations (if database needed)
- [ ] **Step 5**: Create migration service project
- [ ] **Step 6**: Create initial EF Core migration
- [ ] **Step 7**: Add database and services to `AppHost.cs`
- [ ] **Step 8**: Add project references to `AppHost.csproj`
- [ ] **Step 9**: Configure YARP routes in `ApiGateway/appsettings.json`
- [ ] **Step 10**: Create HTTP test file
- [ ] **Step 11**: Regenerate docker-compose with `aspirate generate` (if needed)
- [ ] **Step 12**: Create Dockerfiles for service and migration
- [ ] **Step 13**: Run and test via AppHost (F5)

---

## Key Patterns to Follow

### 1. Database-per-Service Pattern
Each microservice owns its database schema. Never share databases between services.

```csharp
var authDb = sqlServer.AddDatabase("authdb");
var productDb = sqlServer.AddDatabase("productdb");
var orderDb = sqlServer.AddDatabase("orderdb");
```

### 2. Migration Service Pattern
Separate project for migrations ensures schema is ready before API starts.

```csharp
var migrationService = builder.AddProject<Projects.ProductService_MigrationService>("product-migrations")
    .WithReference(productDb)
    .WaitFor(productDb);

var productApi = builder.AddProject<Projects.ProductService>("productservice")
    .WithReference(productDb)
    .WaitForCompletion(migrationService);  // Wait for migrations to finish
```

### 3. Service Discovery via Aspire
Services find each other using logical names, not hardcoded URLs.

```json
"Address": "http://productservice"  // Resolved by Aspire
```

### 4. YARP for Routing
Single entry point through API Gateway with path-based routing.

```json
{
  "Match": {
    "Path": "/api/products/{**catch-all}"
  }
}
```

### 5. JWT Validation in Gateway
Authentication happens at the edge; services trust the gateway.

```json
"AuthorizationPolicy": "authenticated"
```

### 6. SOLID Principles
- **Single Responsibility**: Each class/service has one reason to change
- **Dependency Inversion**: Depend on abstractions (interfaces), not concretions
- **Interface Segregation**: Small, focused interfaces

```csharp
// Service interface in Abstractions/
public interface IProductService
{
    Task<ProductResponse> GetByIdAsync(int id);
    Task<IEnumerable<ProductResponse>> GetAllAsync();
    Task<ProductResponse> CreateAsync(CreateProductRequest request);
}

// Register as scoped
builder.Services.AddScoped<IProductService, ProductService>();
```

---

## Port Reference

| Service | Development (AppHost) | Docker Compose |
|---------|----------------------|----------------|
| SQL Server | `localhost:14330` | `localhost:1433` |
| AuthService | Dynamic (check dashboard) | `localhost:10000` |
| ProductService | `localhost:5002` | `localhost:5003` |
| API Gateway | `localhost:5000` | `localhost:10002` |
| Frontend | Dynamic | `localhost:8000` |
| Aspire Dashboard | Dynamic | `localhost:18888` |

---

## Troubleshooting

### Migration Service Fails

**Error**: `Login failed for user 'sa'`

**Solution**: Add health check and dependencies in `docker-compose.override.yaml`:

```yaml
services:
  sql:
    healthcheck:
      test: /opt/mssql-tools18/bin/sqlcmd -S localhost -U sa -P "$$MSSQL_SA_PASSWORD" -C -Q "SELECT 1" || exit 1
      interval: 10s
      timeout: 5s
      retries: 10
      start_period: 30s

  product-migrations:
    depends_on:
      sql:
        condition: service_healthy
    restart: "no"
```

### Service Not Found in AppHost

**Error**: `Projects.ProductService could not be found`

**Solution**: Rebuild the solution to regenerate the `Projects` class:

```powershell
dotnet build ProjetWeb.AppHost
```

### YARP Route Not Working

**Error**: `404 Not Found` when calling via gateway

**Solution**: 
1. Check YARP configuration in `appsettings.json`
2. Verify path pattern matches your controller route
3. Check Aspire Dashboard for service connectivity

---

## Best Practices

1. **Always use `AddServiceDefaults()` first** in `Program.cs`
2. **Follow the layered architecture** (Controllers → BL → DAL)
3. **Use primary constructors** for dependency injection (.NET 10)
4. **Define service interfaces** in `Abstractions/` folder
5. **Use Options pattern** for configuration
6. **Return `ProblemDetails`** for all errors
7. **Use `async/await`** for all I/O operations
8. **Use `DateTime.UtcNow`** for timestamps
9. **Apply `[Required]` and validation attributes** to DTOs
10. **Write HTTP test files** for all endpoints

---

## Additional Resources

- [.NET Aspire Documentation](https://learn.microsoft.com/en-us/dotnet/aspire/)
- [YARP Documentation](https://microsoft.github.io/reverse-proxy/)
- [EF Core Migrations](https://learn.microsoft.com/en-us/ef/core/managing-schemas/migrations/)
- [Microservices Architecture](https://learn.microsoft.com/en-us/dotnet/architecture/microservices/)

---

## Summary

Adding a new microservice involves:
1. Creating the service and migration projects
2. Structuring with layered architecture
3. Configuring database and migrations
4. Registering in AppHost with proper dependencies
5. Configuring YARP routes in API Gateway
6. Testing via HTTP files and Aspire Dashboard

This maintains consistency with the existing architecture while allowing independent development and deployment of each microservice.
