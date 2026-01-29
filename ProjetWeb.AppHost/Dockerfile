# Use .NET 10 SDK as base image
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS base
WORKDIR /app

# Install Docker CLI and Node.js from Ubuntu repository
# Using docker.io and nodejs packages for simplicity
RUN apt-get update && \
    apt-get install -y docker.io nodejs npm ca-certificates && \
    rm -rf /var/lib/apt/lists/*

# Copy and trust the mkcert development CA certificate
# This is needed in CI/CD environments that use mkcert for local HTTPS interception
COPY mkcert-ca.crt /usr/local/share/ca-certificates/
RUN update-ca-certificates

# Set environment variables
ENV NODE_TLS_REJECT_UNAUTHORIZED=0 \
    DOTNET_CLI_TELEMETRY_OPTOUT=1

# Copy solution and project files for dependency restoration
COPY ProjetWeb.slnx ./
COPY ProjetWeb.AppHost/ProjetWeb.AppHost.csproj ./ProjetWeb.AppHost/
COPY ProjetWeb.Api/ProjetWeb.Api.csproj ./ProjetWeb.Api/
COPY ProjetWeb.ServiceDefaults/ProjetWeb.ServiceDefaults.csproj ./ProjetWeb.ServiceDefaults/

# Restore dependencies for the AppHost project
RUN dotnet restore ProjetWeb.AppHost/ProjetWeb.AppHost.csproj

# Copy frontend package files and install npm dependencies  
COPY ProjetWeb.Frontend/package*.json ./ProjetWeb.Frontend/
RUN npm install --prefix ./ProjetWeb.Frontend

# Copy all source code
COPY . .

# Expose ports for Aspire Dashboard and services
# 15888: Aspire Dashboard HTTP
# 18889: Aspire Dashboard OTLP (OpenTelemetry Protocol)
EXPOSE 15888 18889

# Set working directory to AppHost
WORKDIR /app/ProjetWeb.AppHost

# Use dotnet watch for hot reload support
ENTRYPOINT ["dotnet", "watch", "run", "--non-interactive", "--no-restore"]
