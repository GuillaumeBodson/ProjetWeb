# Use .NET 10 SDK as base image
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS base
WORKDIR /app

# Install Docker CLI for container management
RUN apt-get update && \
    apt-get install -y ca-certificates curl gnupg && \
    install -m 0755 -d /etc/apt/keyrings && \
    curl -fsSL https://download.docker.com/linux/debian/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg && \
    chmod a+r /etc/apt/keyrings/docker.gpg && \
    echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/debian $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null && \
    apt-get update && \
    apt-get install -y docker-ce-cli && \
    rm -rf /var/lib/apt/lists/*

# Install Node.js 24.x for Angular frontend support
RUN curl -fsSL https://deb.nodesource.com/setup_24.x | bash - && \
    apt-get install -y nodejs && \
    rm -rf /var/lib/apt/lists/*

# Copy solution and project files for dependency restoration
COPY ProjetWeb.slnx ./
COPY ProjetWeb.AppHost/ProjetWeb.AppHost.csproj ./ProjetWeb.AppHost/
COPY ProjetWeb.Api/ProjetWeb.Api.csproj ./ProjetWeb.Api/
COPY ProjetWeb.ServiceDefaults/ProjetWeb.ServiceDefaults.csproj ./ProjetWeb.ServiceDefaults/

# Restore dependencies for the AppHost project
RUN dotnet restore ProjetWeb.AppHost/ProjetWeb.AppHost.csproj

# Copy all source code
COPY . .

# Expose ports for Aspire Dashboard and services
# 15888: Aspire Dashboard HTTP
# 18889: Aspire Dashboard HTTPS/OTLP
EXPOSE 15888 18889

# Set working directory to AppHost
WORKDIR /app/ProjetWeb.AppHost

# Use dotnet watch for hot reload support
ENTRYPOINT ["dotnet", "watch", "run", "--non-interactive", "--no-restore"]
