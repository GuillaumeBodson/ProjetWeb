# Stage 1: Build
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

# Copy project files
COPY ProjetWeb.Api/ProjetWeb.Api.csproj ProjetWeb.Api/
COPY ProjetWeb.ServiceDefaults/ProjetWeb.ServiceDefaults.csproj ProjetWeb.ServiceDefaults/

# Restore dependencies
RUN dotnet restore ProjetWeb.Api/ProjetWeb.Api.csproj

# Copy source files
COPY ProjetWeb.Api/ ProjetWeb.Api/
COPY ProjetWeb.ServiceDefaults/ ProjetWeb.ServiceDefaults/

# Build the project
RUN dotnet build ProjetWeb.Api/ProjetWeb.Api.csproj -c Release -o /app/build

# Stage 2: Publish
FROM build AS publish
RUN dotnet publish ProjetWeb.Api/ProjetWeb.Api.csproj -c Release -o /app/publish /p:UseAppHost=false

# Stage 3: Final runtime image
FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS final
WORKDIR /app
EXPOSE 5000

COPY --from=publish /app/publish .

ENV ASPNETCORE_URLS=http://+:5000

ENTRYPOINT ["dotnet", "ProjetWeb.Api.dll"]
