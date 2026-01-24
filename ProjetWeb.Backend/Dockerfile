# Stage 1: Base runtime
FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS base
WORKDIR /app
EXPOSE 5000

# Stage 2: Build
FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src

# Copy project files (placeholder - to be updated when backend is added)
# COPY ["ProjetWeb.Backend.csproj", "./"]
# RUN dotnet restore "ProjetWeb.Backend.csproj"

# Copy all source files
COPY . .

# Build the project (placeholder - to be updated when backend is added)
# WORKDIR "/src"
# RUN dotnet build "ProjetWeb.Backend.csproj" -c Release -o /app/build

# Stage 3: Publish
FROM build AS publish
# RUN dotnet publish "ProjetWeb.Backend.csproj" -c Release -o /app/publish /p:UseAppHost=false

# Stage 4: Final
FROM base AS final
WORKDIR /app
# COPY --from=publish /app/publish .

# Placeholder entrypoint - to be updated when backend is added
# ENTRYPOINT ["dotnet", "ProjetWeb.Backend.dll"]

# Temporary command to keep container running for development
CMD ["sh", "-c", "echo 'Backend placeholder - waiting for .NET backend implementation' && tail -f /dev/null"]
