var builder = DistributedApplication.CreateBuilder(args);

// Add SQL Server with a dedicated database for auth
var sqlServer = builder.AddSqlServer("sql")
    .WithImageTag("2025-latest") 
    .WithDataVolume("authservice-sqldata") // Persist data across restarts
    .WithEndpoint("tcp", endpoint =>
    {
        endpoint.Port = 14330;  // Fixed external port
        endpoint.TargetPort = 1433;
    });

var authDb = sqlServer.AddDatabase("authdb");

// Migration service runs first
var migrationService = builder.AddProject<Projects.Authentication_MigrationService>("auth-migrations")
    .WithReference(authDb)
    .WaitFor(authDb);

var authApi = builder.AddProject<Projects.Authentication_API>("authservice")
    .WithReference(authDb) // Inject connection string automatically
    .WaitFor(authDb)
    .WaitForCompletion(migrationService);

// Add API Gateway with reference to backend services
var apiGateway = builder.AddProject<Projects.ApiGateway>("apigateway")
    .WithReference(authApi)
    .WaitFor(authApi);

// Add the Angular frontend and reference the API Gateway
var frontend = builder.AddJavaScriptApp("frontend", "../ProjetWeb.Frontend", "start")
    .WithReference(apiGateway)
    .WaitFor(apiGateway)
    .WithHttpEndpoint(port: 4200, targetPort: 4200, env: "PORT", isProxied: false)
    .WithExternalHttpEndpoints();

builder.Build().Run();
