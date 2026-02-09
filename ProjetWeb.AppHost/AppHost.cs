var builder = DistributedApplication.CreateBuilder(args);

// Add SQL Server with databases 
var sqlServer = builder.AddSqlServer("sql")
    .WithImageTag("2025-latest")
    .WithDataVolume("data") // Persist data across restarts
    .WithEndpoint("tcp", endpoint =>
    {
        endpoint.Port = 14330;  // Fixed external port
        endpoint.TargetPort = 1433;
    });

// Authentication database
var authDb = sqlServer.AddDatabase("authdb");

// Site Management database
var siteManagementDb = sqlServer.AddDatabase("sitemanagementdb");

// Authentication migration service
var authMigrationService = builder.AddProject<Projects.Authentication_MigrationService>("auth-migrations")
    .WithReference(authDb)
    .WaitFor(authDb);

// Site Management migration service
var siteMigrationService = builder.AddProject<Projects.SiteManagement_MigrationService>("site-migrations")
    .WithReference(siteManagementDb)
    .WaitFor(siteManagementDb);

// Authentication API
var authApi = builder.AddProject<Projects.Authentication_API>("authservice")
    .WithReference(authDb) // Inject connection string automatically
    .WaitFor(authDb)
    .WaitForCompletion(authMigrationService);

// Site Management API
var siteManagementApi = builder.AddProject<Projects.SiteManagement_API>("sitemanagement")
    .WithReference(siteManagementDb) // Inject connection string automatically
    .WaitFor(siteManagementDb)
    .WaitForCompletion(siteMigrationService);

// Add API Gateway with reference to backend services
var apiGateway = builder.AddProject<Projects.ApiGateway>("apigateway")
    .WithReference(authApi)
    .WithReference(siteManagementApi)
    .WaitFor(authApi)
    .WaitFor(siteManagementApi);

// Add the Angular frontend and reference the API Gateway
var frontend = builder.AddJavaScriptApp("frontend", "../ProjetWeb.Frontend", "start")
    .WithReference(apiGateway)
    .WaitFor(apiGateway)
    .WithHttpEndpoint(port: 4200, targetPort: 4200, env: "PORT", isProxied: false)
    .WithExternalHttpEndpoints();

builder.Build().Run();