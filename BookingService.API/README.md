# BookingService Microservice

## Overview
The BookingService is a .NET 10 Aspire microservice that manages booking operations for sports facilities. It follows the same architectural patterns as the other microservices in the solution.

## Project Structure

```
BookingService.API/
├── BL/                                    # Business Logic Layer
│   ├── Mappers/
│   │   └── BookingMapper.cs              # Entity-to-DTO mappings
│   ├── Models/
│   │   ├── BookingResponse.cs            # Response DTOs
│   │   ├── CreateBookingRequest.cs       # Request DTOs
│   │   └── Validators/
│   │       └── CreateBookingRequestValidator.cs
│   └── Services/
│       ├── Abstractions/
│       │   └── IBookingService.cs        # Service interface
│       └── BookingService.cs             # Service implementation
├── Controllers/
│   └── BookingsController.cs             # API endpoints
├── DAL/                                   # Data Access Layer
│   ├── Configurations/
│   │   └── BookingConfiguration.cs       # EF Core entity configuration
│   ├── Entities/
│   │   └── Booking.cs                    # Domain entity
│   ├── BookingDbContext.cs               # EF Core DbContext
│   └── BookingDbContextFactory.cs        # Design-time DbContext factory
├── Migrations/                            # EF Core migrations (to be generated)
└── Program.cs                             # Application entry point

Booking.MigrationService/
└── Program.cs                             # Migration worker service
```

## Features

### Entities
- **Booking**: Represents a booking with the following properties:
  - Id (int)
  - UserId (string) - References the user who made the booking
  - SiteId (int) - References the site
  - CourtId (int) - References the court
  - TimeSlotId (int) - References the time slot
  - BookingDate (DateTime)
  - Status (BookingStatus enum: Confirmed, Cancelled, Completed)
  - Price (decimal)
  - CreatedAt (DateTime)
  - CancelledAt (DateTime?)

### API Endpoints

All endpoints require authentication (JWT Bearer token).

#### POST /api/bookings
Create a new booking.
- **Request**: `CreateBookingRequest`
- **Response**: `BookingResponse` (201 Created)

#### GET /api/bookings/{id}
Get a booking by ID.
- **Response**: `BookingResponse` (200 OK) or 404 Not Found

#### GET /api/bookings/my
Get all bookings for the authenticated user.
- **Response**: `IEnumerable<BookingResponse>` (200 OK)

#### GET /api/bookings/site/{siteId}
Get all bookings for a specific site.
- **Response**: `IEnumerable<BookingResponse>` (200 OK)

#### GET /api/bookings/court/{courtId}
Get all bookings for a specific court.
- **Response**: `IEnumerable<BookingResponse>` (200 OK)

#### GET /api/bookings/timeslot/{timeSlotId}
Get all bookings for a specific time slot.
- **Response**: `IEnumerable<BookingResponse>` (200 OK)

#### POST /api/bookings/{id}/cancel
Cancel a booking.
- **Response**: `BookingResponse` (200 OK)
- **Errors**: 
  - 404 if booking not found
  - 403 if user is not authorized
  - 409 if booking is already cancelled

## Integration with Aspire

The BookingService is integrated into the Aspire AppHost:

1. **Database**: Uses SQL Server with a dedicated `bookingdb` database
2. **Migration Service**: Runs on startup to apply EF Core migrations
3. **Service Dependencies**: 
   - Waits for the database to be ready
   - Waits for migrations to complete
   - Registered with the API Gateway

## Configuration

### appsettings.json
```json
{
  "Jwt": {
    "Key": "your-super-secret-key-at-least-32-characters-long!",
    "Issuer": "https://localhost:5000",
    "Audience": "https://localhost:5000"
  }
}
```

## Next Steps

### 1. Generate Initial Migration
Run the following command to create the initial database migration:

```bash
dotnet ef migrations add InitialCreate --project BookingService.API/Booking.API.csproj --startup-project BookingService.API/Booking.API.csproj
```

### 2. Integration with SiteManagement API
The `CreateBookingAsync` method currently has placeholder code for:
- Validating that the time slot exists and is available
- Retrieving the price from the time slot

You'll need to implement HTTP client calls to the SiteManagement API to:
- Verify the site, court, and time slot exist
- Check if the time slot is available (not already booked)
- Retrieve the price for the time slot

### 3. Add HTTP Client for SiteManagement API
Add a typed HTTP client to call the SiteManagement API:

```csharp
builder.Services.AddHttpClient<ISiteManagementClient, SiteManagementClient>(client =>
{
    client.BaseAddress = new Uri("http://sitemanagement");
});
```

### 4. Implement Business Rules
- Prevent double booking (same time slot, same date)
- Add cancellation policies (e.g., can't cancel within 24 hours)
- Add payment integration
- Send confirmation emails/notifications

### 5. Add Unit Tests
Create a test project to cover:
- Service layer logic
- Validators
- Controller endpoints

## Technologies Used

- **.NET 10**: Latest .NET version
- **Aspire**: Cloud-native application development
- **Entity Framework Core 10**: ORM for database access
- **FluentValidation**: Request validation
- **JWT Authentication**: Secure API endpoints
- **OpenAPI/Swagger**: API documentation
- **SQL Server**: Database

## SOLID Principles

The service follows SOLID principles:
- **Single Responsibility**: Each class has a single, well-defined responsibility
- **Open/Closed**: Services are open for extension through interfaces
- **Liskov Substitution**: Interfaces can be swapped with implementations
- **Interface Segregation**: Small, focused interfaces (IBookingService)
- **Dependency Inversion**: Depends on abstractions (IBookingService interface)
