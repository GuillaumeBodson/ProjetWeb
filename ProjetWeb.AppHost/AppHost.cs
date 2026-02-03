var builder = DistributedApplication.CreateBuilder(args);

// Add SQL Server with a dedicated database for auth
var sqlServer = builder.AddSqlServer("sql")
    .WithImageTag("2025-latest") 
    .WithDataVolume("authservice-sqldata"); // Persist data across restarts

var authDb = sqlServer.AddDatabase("authdb");

var authApi = builder.AddProject<Projects.Authentication_API>("authservice")
    .WithReference(authDb) // Inject connection string automatically
    .WaitFor(authDb);

// Add API Gateway with reference to backend services
var apiGateway = builder.AddProject<Projects.ApiGateway>("apigateway")
    .WithReference(authApi)
    .WaitFor(authApi);

// Add the Angular frontend and reference the API Gateway
var frontend = builder.AddJavaScriptApp("frontend", "../ProjetWeb.Frontend", "start")
    .WithReference(apiGateway)
    .WaitFor(apiGateway)
    .WithHttpEndpoint(env: "PORT")
    .WithExternalHttpEndpoints();

builder.Build().Run();
