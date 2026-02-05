# SiteManagement API

Microservice for managing sites, their schedules, and time slot bookings.

## Overview

The SiteManagement API is a .NET 10 microservice built with .NET Aspire that handles:
- **Site Management**: Create, read, update, and delete sites
- **Schedule Configuration**: Define weekly schedules with configurable time slots
- **Time Slot Booking**: Book and unbook individual time slots
- **Closed Days**: Track days when a site is closed

## Technology Stack

- **.NET 10** with ASP.NET Core
- **Entity Framework Core 10** with SQL Server
- **Aspire 13.1.0** for service orchestration
- **YARP** for API Gateway routing
- **JWT Authentication** (validated at gateway)

## Project Structure

```
SiteManagement.API/
├── Controllers/              # API endpoints
│   └── SitesController.cs
├── BL/                      # Business Logic
│   ├── Models/              # DTOs (requests/responses)
│   └── Services/
│       ├── Abstractions/    # Service interfaces
│       └── SiteService.cs   # Service implementation
├── DAL/                     # Data Access Layer
│   ├── Entities/            # Entity classes
│   ├── Configurations/      # EF Core configurations
│   ├── Migrations/          # Database migrations
│   ├── SiteManagementDbContext.cs
│   └── SiteManagementDbContextFactory.cs
└── Infrastructure/
    └── GlobalExceptionHandler.cs
```

## Database Schema

### Tables
- **Sites**: Main site information
- **PlannedDays**: Weekly schedule configuration per site
- **TimeSlots**: Individual bookable time slots

### Relationships
- Site → PlannedDays (one-to-many, cascade delete)
- PlannedDay → TimeSlots (one-to-many, cascade delete)

## API Endpoints

### Sites

#### Get All Sites
```http
GET /api/sites
Authorization: Bearer {token}
```

#### Get Site by ID
```http
GET /api/sites/{id}
Authorization: Bearer {token}
```

#### Create Site
```http
POST /api/sites
Authorization: Bearer {token}
Content-Type: application/json

{
    "name": "Main Campus",
    "closedDays": ["2024-12-25", "2025-01-01"],
    "courts": [
        {
            "number": 1
        },
        {
            "number": 2
        },
        {
            "number": 3
        }
    ],
    "schedule": [
        {
            "dayOfWeek": 1,  // Monday
            "numberOfTimeSlots": 8
        },
        {
            "dayOfWeek": 2,  // Tuesday
            "numberOfTimeSlots": 8
        }
    ]
}
```

**Response:**
```json
{
    "id": "guid",
    "name": "Main Campus",
    "closedDays": ["2024-12-25", "2025-01-01"],
    "schedule": [
        {
            "id": "guid",
            "dayOfWeek": 1,
            "numberOfTimeSlots": 8,
            "timeSlots": [
                {
                    "id": "guid",
                    "timeSlotNumber": 1,
                    "isBooked": false
                }
                // ... more time slots
            ]
        }
    ]
}
```

#### Update Site
```http
PUT /api/sites/{id}
Authorization: Bearer {token}
Content-Type: application/json

{
    "name": "Updated Campus Name",
    "closedDays": ["2024-12-25"],
    "schedule": [...]
}
```

#### Delete Site
```http
DELETE /api/sites/{id}
Authorization: Bearer {token}
```

### Time Slots

#### Book/Unbook Time Slot
```http
POST /api/sites/timeslots/book
Authorization: Bearer {token}
Content-Type: application/json

{
    "timeSlotId": "guid",
    "isBooked": true
}
```

**Response:**
```json
{
    "id": "guid",
    "timeSlotNumber": 1,
    "isBooked": true
}
```

## Running Locally

### Via Aspire AppHost (Recommended)
```powershell
# From solution root
cd ProjetWeb.AppHost
dotnet run

# Or press F5 in Visual Studio with AppHost as startup project
```

### Direct (without Aspire)
```powershell
cd SiteManagement.API
dotnet run
```

## Configuration

### appsettings.json
The service uses Aspire for configuration, so no manual connection string is needed.

### Environment Variables (Docker)
- `ConnectionStrings__sitedb`: SQL Server connection string (provided by Aspire)

## Database Migrations

### Create New Migration
```powershell
dotnet ef migrations add MigrationName --project SiteManagement.API --startup-project SiteManagement.API
```

### Apply Migrations
Migrations are applied automatically by the `SiteManagement.MigrationService` when the application starts.

### Manual Migration
```powershell
dotnet ef database update --project SiteManagement.API --startup-project SiteManagement.API
```

## Testing

### HTTP File
Use `SiteManagement.API.http` in the project root for manual testing.

### Unit Tests
*(Not yet implemented - see Next Steps below)*

### Integration Tests
*(Not yet implemented - see Next Steps below)*

## Docker

### Build Image
```powershell
docker build -t sitemanagement-api -f SiteManagement.API/Dockerfile .
```

### Run Container
```powershell
docker run -p 5003:8080 -e ConnectionStrings__sitedb="Server=..." sitemanagement-api
```

## Dependencies

### NuGet Packages
- `Aspire.Microsoft.EntityFrameworkCore.SqlServer` (13.1.0)
- `Microsoft.EntityFrameworkCore.SqlServer` (10.0.2)
- `Microsoft.EntityFrameworkCore.Design` (10.0.2)
- `Microsoft.AspNetCore.OpenApi` (10.0.2)

### Project References
- `ProjetWeb.ServiceDefaults`

## Best Practices

- ✅ **Layered Architecture**: Clear separation of concerns (Controllers → BL → DAL)
- ✅ **SOLID Principles**: Single responsibility, dependency inversion
- ✅ **Primary Constructors**: Modern C# 12 syntax
- ✅ **Entity Configurations**: IEntityTypeConfiguration<T> for each entity
- ✅ **DTOs**: Request/Response models separate from entities
- ✅ **Validation**: Data annotations on DTOs
- ✅ **Global Exception Handling**: ProblemDetails for consistent error responses
- ✅ **Structured Logging**: ILogger<T> injection
- ✅ **Async/Await**: All I/O operations are asynchronous

## Known Issues

### Entity Name Typo
The property `NumberOfTimeSplots` in `PlannedDay` has a typo (should be `TimeSlots`). This was kept from the original design for compatibility. Consider fixing in a future migration.

## Next Steps

1. **Add Authorization**
   - Role-based access control (admin, user)
   - Fine-grained permissions for booking

2. **Add Business Rules**
   - Prevent booking on closed days
   - Prevent double-booking
   - Add booking time limits

3. **Add Validation**
   - Validate day-of-week ranges
   - Validate time slot numbers
   - Validate closed days don't conflict with bookings

4. **Add Tests**
   - Unit tests for SiteService
   - Integration tests for API endpoints
   - Test entity configurations

5. **Add Features**
   - Booking history/audit trail
   - Time slot capacity (multiple bookings per slot)
   - Recurring closed days (e.g., all Sundays)
   - Site availability API

6. **Performance**
   - Add caching for frequently accessed sites
   - Optimize queries with proper indexing
   - Add pagination for large result sets

## Contributing

Follow the guidelines in `Documents/adding-new-microservice.md` when adding new features.

## Related Documentation

- [Adding a New Microservice](../Documents/adding-new-microservice.md)
- [SiteManagement Implementation Summary](../Documents/sitemanagement-implementation-summary.md)
- [SiteManagement Quick Start](../Documents/sitemanagement-quickstart.md)
- [Copilot Instructions](../.github/copilot-instructions.md)

## License

*(Add your license information here)*

## Support

For issues or questions, please:
1. Check the Aspire Dashboard logs
2. Review the documentation files
3. Open an issue in the repository
