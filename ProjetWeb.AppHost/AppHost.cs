var builder = DistributedApplication.CreateBuilder(args);

// Configure Aspire Dashboard URL
builder.Configuration["ASPNETCORE_URLS"] = "http://+:15888";

// Add the .NET API backend
var api = builder.AddProject<Projects.ProjetWeb_Api>("api")
    .WithHttpEndpoint(port: 5000, env: "PORT");

// Add the Angular frontend using NPM and reference the API
var frontend = builder.AddNpmApp("frontend", "../ProjetWeb.Frontend", "start")
    .WithReference(api)
    .WaitFor(api)
    .WithHttpEndpoint(port: 4200, env: "PORT")
    .WithExternalHttpEndpoints()
    .PublishAsDockerFile();

builder.Build().Run();
