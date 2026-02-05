FROM mcr.microsoft.com/dotnet/runtime:10.0 AS base
USER $APP_UID
WORKDIR /app

FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
ARG BUILD_CONFIGURATION=Release
WORKDIR /src
COPY ["SiteManagement.MigrationService/SiteManagement.MigrationService.csproj", "SiteManagement.MigrationService/"]
COPY ["SiteManagement.API/SiteManagement.API.csproj", "SiteManagement.API/"]
COPY ["ProjetWeb.ServiceDefaults/ProjetWeb.ServiceDefaults.csproj", "ProjetWeb.ServiceDefaults/"]
RUN dotnet restore "./SiteManagement.MigrationService/SiteManagement.MigrationService.csproj"
COPY . .
WORKDIR "/src/SiteManagement.MigrationService"
RUN dotnet build "./SiteManagement.MigrationService.csproj" -c $BUILD_CONFIGURATION -o /app/build

FROM build AS publish
ARG BUILD_CONFIGURATION=Release
RUN dotnet publish "./SiteManagement.MigrationService.csproj" -c $BUILD_CONFIGURATION -o /app/publish /p:UseAppHost=false

FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "SiteManagement.MigrationService.dll"]
