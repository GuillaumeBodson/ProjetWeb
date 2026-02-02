using Google.Protobuf.WellKnownTypes;

var builder = DistributedApplication.CreateBuilder(args);



var authApi =  builder.AddProject<Projects.Authentication_API>("authservice");

// Add the Angular frontend and reference the API
var frontend = builder.AddJavaScriptApp("frontend", "../ProjetWeb.Frontend", "start")
    .WithReference(authApi)
    .WaitFor(authApi)
    .WithHttpEndpoint(env: "PORT")
    .WithExternalHttpEndpoints();

builder.Build().Run();
