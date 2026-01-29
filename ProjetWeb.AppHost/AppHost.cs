var builder = DistributedApplication.CreateBuilder(args);

// Add the .NET API backend
var api = builder.AddProject<Projects.ProjetWeb_Api>("api");

// Add the Angular frontend and reference the API
var frontend = builder.AddNpmApp("frontend", "../ProjetWeb.Frontend", "start")
    .WithReference(api)
    .WaitFor(api)
    .WithHttpEndpoint(env: "PORT")
    .WithExternalHttpEndpoints();

builder.Build().Run();
