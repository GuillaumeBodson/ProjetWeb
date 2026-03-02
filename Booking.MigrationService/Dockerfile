# See https://aka.ms/customizecontainer to learn how to customize your debug container and how Visual Studio uses this Dockerfile to build your images for faster debugging.

# This stage is used when running from VS in fast mode (Default for Debug configuration)
FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS base
USER $APP_UID
WORKDIR /app

FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
ARG BUILD_CONFIGURATION=Release
WORKDIR /src
COPY ["Booking.MigrationService/Booking.MigrationService.csproj", "Booking.MigrationService/"]
COPY ["BookingService.API/Booking.API.csproj", "BookingService.API/"]
COPY ["ProjetWeb.ServiceDefaults/ProjetWeb.ServiceDefaults.csproj", "ProjetWeb.ServiceDefaults/"]
COPY ["ProjetWeb.Shared/ProjetWeb.Shared.csproj", "ProjetWeb.Shared/"]
COPY ["ProjetWeb.Shared.Migration/ProjetWeb.Shared.Migration.csproj", "ProjetWeb.Shared.Migration/"]
RUN dotnet restore "./Booking.MigrationService/Booking.MigrationService.csproj"
COPY . .
WORKDIR "/src/Booking.MigrationService"
RUN dotnet build "./Booking.MigrationService.csproj" -c $BUILD_CONFIGURATION -o /app/build /p:OpenApiGenerateDocuments=false

FROM build AS publish
ARG BUILD_CONFIGURATION=Release
RUN dotnet publish "./Booking.MigrationService.csproj" -c $BUILD_CONFIGURATION -o /app/publish \
    /p:UseAppHost=false \
    /p:OpenApiGenerateDocuments=false \
    /p:ErrorOnDuplicatePublishOutputFiles=false

FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "Booking.MigrationService.dll"]