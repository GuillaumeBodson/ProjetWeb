# SiteManagement Microservice - Implementation Checklist

Based on the guide in `adding-new-microservice.md`, here's what was completed:

## ✅ Checklist for New Microservice

- [x] **Step 1**: Create service project with `dotnet new webapi`
- [x] **Step 2**: Structure project with layered architecture (Controllers, BL, DAL, Infrastructure)
- [x] **Step 3**: Configure `Program.cs` with `AddServiceDefaults()`
- [x] **Step 4**: Create `DbContext` and entity configurations
- [x] **Step 5**: Create migration service project
- [x] **Step 6**: Create initial EF Core migration (`InitialCreate`)
- [x] **Step 7**: Add database and services to `AppHost.cs`
- [x] **Step 8**: Add project references to `AppHost.csproj`
- [x] **Step 9**: Configure YARP routes in `ApiGateway/appsettings.json`
- [x] **Step 10**: Create HTTP test file
- [x] **Step 11**: Regenerate docker-compose with `aspirate generate` (optional)
- [x] **Step 12**: Create/Update Dockerfiles for service and migration
- [x] **Step 13**: Ready to run and test via AppHost (F5)

## Architecture Diagram

```
┌─────────────────┐
│   Frontend      │
│  (Angular 21)   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  API Gateway    │
│    (YARP)       │
│  JWT Validation │
└────┬────────┬───┘
     │        │
     ▼        ▼
┌─────────┐  ┌──────────────┐
│  Auth   │  │SiteManagement│
│ Service │  │   Service    │
└────┬────┘  └──────┬───────┘
     │              │
     ▼              ▼
┌─────────┐  ┌──────────────┐
│ authdb  │  │   sitedb     │
│(SQL Srv)│  │  (SQL Srv)   │
└─────────┘  └──────────────┘
```

## Service Startup Order

1. **SQL Server** starts
2. **auth-migrations** runs (waits for authdb)
3. **site-migrations** runs (waits for sitedb)
4. **authservice** starts (waits for migrations to complete)
5. **sitemanagement-api** starts (waits for migrations to complete)
6. **apigateway** starts (waits for backend services)
7. **frontend** starts (waits for gateway)

## URLs

| Service | Port | URL |
|---------|------|-----|
| SQL Server | 14330 | localhost:14330 |
| AuthService | Dynamic | Via Aspire |
| SiteManagement | 5003 | localhost:5003 |
| API Gateway | 5000 | localhost:5000 |
| Frontend | 4200 | localhost:4200 |
| Aspire Dashboard | Dynamic | Shown at startup |

## Gateway Routes

| Route | Backend | Auth Required |
|-------|---------|---------------|
| `/api/auth/*` | authservice | No |
| `/api/sites/*` | sitemanagement-api | Yes |

## Quick Start

```powershell
# 1. Open solution in Visual Studio
# 2. Set ProjetWeb.AppHost as startup project
# 3. Press F5

# OR via command line:
cd ProjetWeb.AppHost
dotnet run
```

## Testing

### 1. Get JWT Token
```bash
POST http://localhost:5000/api/auth/login
Content-Type: application/json

{
  "email": "test@example.com",
  "password": "password"
}
```

### 2. Create a Site
```bash
POST http://localhost:5000/api/sites
Authorization: Bearer YOUR_TOKEN
Content-Type: application/json

{
    "name": "Main Campus",
    "schedule": [
        {
            "dayOfWeek": 1,
            "numberOfTimeSlots": 8
        },
        {
            "dayOfWeek": 2,
            "numberOfTimeSlots": 8
        }
    ]
}
```

### 3. Get All Sites
```bash
GET http://localhost:5000/api/sites
Authorization: Bearer YOUR_TOKEN
```

### 4. Book a Time Slot
```bash
POST http://localhost:5000/api/sites/timeslots/book
Authorization: Bearer YOUR_TOKEN
Content-Type: application/json

{
    "timeSlotId": "GUID_FROM_SITE_RESPONSE",
    "isBooked": true
}
```

## Common Issues & Solutions

### Issue: Migration service fails to start
**Solution**: Check Aspire Dashboard logs. SQL Server may need more time to initialize. The migration service has built-in retry logic with exponential backoff.

### Issue: "Projects.SiteManagement_MigrationService not found"
**Solution**: Rebuild the AppHost project to regenerate the Projects class:
```powershell
dotnet build ProjetWeb.AppHost
```

### Issue: 404 when calling via gateway
**Solution**: 
1. Check YARP configuration in `ApiGateway/appsettings.json`
2. Verify service is running in Aspire Dashboard
3. Check path matches route pattern

### Issue: 401 Unauthorized
**Solution**: 
1. Get a fresh JWT token from `/api/auth/login`
2. Add `Authorization: Bearer TOKEN` header
3. Ensure token hasn't expired

## Monitoring

Use the Aspire Dashboard to monitor:
- Service health (green = running, yellow = degraded, red = down)
- Logs from all services
- Traces for distributed tracing
- Metrics (CPU, memory, requests)

## What's Next?

See the "Next Steps" section in `sitemanagement-implementation-summary.md` for:
- Adding authorization policies
- Adding business rule validation
- Creating unit and integration tests
- Building the Angular frontend
- Deployment to production

---

🎉 **Congratulations! The SiteManagement microservice is complete and ready to use!**
