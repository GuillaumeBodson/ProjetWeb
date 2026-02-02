var builder = DistributedApplication.CreateBuilder(args);

var authApi = builder.AddProject<Projects.Authentication_API>("authservice");

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
