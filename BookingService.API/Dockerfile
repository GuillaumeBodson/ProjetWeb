FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS base
USER $APP_UID
WORKDIR /app
EXPOSE 8080
EXPOSE 8081

FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
ARG BUILD_CONFIGURATION=Release
WORKDIR /src
COPY ["BookingService.API/Booking.API.csproj", "BookingService.API/"]
COPY ["ProjetWeb.ServiceDefaults/ProjetWeb.ServiceDefaults.csproj", "ProjetWeb.ServiceDefaults/"]
COPY ["ProjetWeb.Shared/ProjetWeb.Shared.csproj", "ProjetWeb.Shared/"]
RUN dotnet restore "./BookingService.API/Booking.API.csproj"
COPY . .
WORKDIR "/src/BookingService.API"
RUN dotnet build "./Booking.API.csproj" -c $BUILD_CONFIGURATION -o /app/build

FROM build AS publish
ARG BUILD_CONFIGURATION=Release
RUN dotnet publish "./Booking.API.csproj" -c $BUILD_CONFIGURATION -o /app/publish /p:UseAppHost=false

FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "Booking.API.dll"]