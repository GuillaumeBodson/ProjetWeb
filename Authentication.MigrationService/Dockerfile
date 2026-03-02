FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS base
USER $APP_UID
WORKDIR /app

FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
ARG BUILD_CONFIGURATION=Release
WORKDIR /src
COPY ["Authentication.MigrationService/Authentication.MigrationService.csproj", "Authentication.MigrationService/"]
COPY ["AuthService/Authentication.API.csproj", "AuthService/"]
COPY ["ProjetWeb.ServiceDefaults/ProjetWeb.ServiceDefaults.csproj", "ProjetWeb.ServiceDefaults/"]
COPY ["ProjetWeb.Shared/ProjetWeb.Shared.csproj", "ProjetWeb.Shared/"]
COPY ["ProjetWeb.Shared.Migration/ProjetWeb.Shared.Migration.csproj", "ProjetWeb.Shared.Migration/"]
RUN dotnet restore "./Authentication.MigrationService/Authentication.MigrationService.csproj"
COPY . .
WORKDIR "/src/Authentication.MigrationService"
RUN dotnet build "./Authentication.MigrationService.csproj" -c $BUILD_CONFIGURATION -o /app/build /p:OpenApiGenerateDocuments=false

FROM build AS publish
ARG BUILD_CONFIGURATION=Release
RUN dotnet publish "./Authentication.MigrationService.csproj" -c $BUILD_CONFIGURATION -o /app/publish \
    /p:UseAppHost=false \
    /p:OpenApiGenerateDocuments=false \
    /p:ErrorOnDuplicatePublishOutputFiles=false

FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "Authentication.MigrationService.dll"]