# Court Entity Integration - Quick Reference

## Entity Relationship Diagram

```
┌─────────────────┐
│      Site       │
│  - Id (PK)      │
│  - Name         │
│  - ClosedDays   │
└────┬────────┬───┘
     │        │
     │        └──────────────────┐
     │                           │
     ▼                           ▼
┌─────────────────┐      ┌─────────────────┐
│     Court       │      │   PlannedDay    │
│  - Id (PK)      │      │  - Id (PK)      │
│  - Number       │      │  - SiteId (FK)  │
│  - SiteId (FK)  │      │  - DayOfWeek    │
└────┬────────────┘      │  - NumSlots     │
     │                   └────┬────────────┘
     │                        │
     │         ┌──────────────┘
     │         │
     ▼         ▼
┌─────────────────────────┐
│      TimeSlot           │
│  - Id (PK)              │
│  - PlannedDayId (FK)    │
│  - CourtId (FK)  ◄──────┤ NEW
│  - TimeSlotNumber       │
│  - IsBooked             │
└─────────────────────────┘
```

## Key Relationships

| Parent | Child | Relationship | Delete Behavior |
|--------|-------|-------------|----------------|
| Site | Court | One-to-Many | Cascade |
| Site | PlannedDay | One-to-Many | Cascade |
| PlannedDay | TimeSlot | One-to-Many | Cascade |
| Court | TimeSlot | One-to-Many | Restrict |

## Unique Constraints

| Table | Constraint | Purpose |
|-------|-----------|---------|
| Court | (SiteId, Number) | No duplicate court numbers per site |
| PlannedDay | (SiteId, DayOfWeek) | One schedule per day per site |
| TimeSlot | (PlannedDayId, TimeSlotNumber, CourtId) | No duplicate slots per court per day |

## Time Slot Calculation

```
Total Time Slots = Sites × Courts × PlannedDays × TimeSlots/Day
```

**Example:**
- 1 Site
- 3 Courts (numbered 1, 2, 3)
- 5 PlannedDays (Mon-Fri)
- 8 TimeSlots/Day (9am-5pm hourly)

**Result: 1 × 3 × 5 × 8 = 120 total bookable time slots**

## API Request/Response Examples

### Create Site with Courts

```http
POST /api/sites
```

```json
{
    "name": "Sports Complex",
    "courts": [
        { "number": 1 },
        { "number": 2 },
        { "number": 3 }
    ],
    "schedule": [
        { "dayOfWeek": 1, "numberOfTimeSlots": 8 },
        { "dayOfWeek": 2, "numberOfTimeSlots": 8 },
        { "dayOfWeek": 3, "numberOfTimeSlots": 8 },
        { "dayOfWeek": 4, "numberOfTimeSlots": 8 },
        { "dayOfWeek": 5, "numberOfTimeSlots": 6 }
    ],
    "closedDays": ["2024-12-25", "2025-01-01"]
}
```

### Response

```json
{
    "id": "site-guid",
    "name": "Sports Complex",
    "closedDays": ["2024-12-25", "2025-01-01"],
    "courts": [
        { "id": "court1-guid", "number": 1 },
        { "id": "court2-guid", "number": 2 },
        { "id": "court3-guid", "number": 3 }
    ],
    "schedule": [
        {
            "id": "day-guid",
            "dayOfWeek": 1,
            "numberOfTimeSlots": 8,
            "timeSlots": [
                {
                    "id": "slot1-guid",
                    "timeSlotNumber": 1,
                    "courtId": "court1-guid",
                    "isBooked": false
                },
                {
                    "id": "slot2-guid",
                    "timeSlotNumber": 1,
                    "courtId": "court2-guid",
                    "isBooked": false
                },
                {
                    "id": "slot3-guid",
                    "timeSlotNumber": 1,
                    "courtId": "court3-guid",
                    "isBooked": false
                }
                // ... 21 more slots (8 time slots × 3 courts - 3 shown)
            ]
        }
        // ... 4 more days
    ]
}
```

## Common Queries

### Get all available time slots for a specific court on a specific day

```csharp
var availableSlots = await context.TimeSlots
    .Where(ts => ts.CourtId == courtId 
              && ts.PlannedDay.DayOfWeek == dayOfWeek
              && !ts.IsBooked)
    .ToListAsync();
```

### Get all courts for a site

```csharp
var courts = await context.Courts
    .Where(c => c.SiteId == siteId)
    .OrderBy(c => c.Number)
    .ToListAsync();
```

### Get all booked slots for a court

```csharp
var bookedSlots = await context.TimeSlots
    .Where(ts => ts.CourtId == courtId && ts.IsBooked)
    .Include(ts => ts.PlannedDay)
    .ToListAsync();
```

## Migration Impact

### Before Migration
```sql
TimeSlots
- Id
- PlannedDayId
- TimeSlotNumber
- IsBooked
```

### After Migration
```sql
Courts (NEW TABLE)
- Id
- Number
- SiteId

TimeSlots
- Id
- PlannedDayId
- CourtId (NEW)
- TimeSlotNumber
- IsBooked
```

## Validation Rules

| Field | Rule |
|-------|------|
| Court.Number | Required, Range: 1-100 |
| Court.SiteId | Required, Must exist |
| TimeSlot.CourtId | Required, Must exist |
| TimeSlot.TimeSlotNumber | Required |
| Unique (SiteId, Court.Number) | Must be unique |
| Unique (PlannedDayId, TimeSlotNumber, CourtId) | Must be unique |

## HTTP Status Codes

| Endpoint | Success | Not Found | Validation Error |
|----------|---------|-----------|-----------------|
| GET /api/sites | 200 | 404 | - |
| POST /api/sites | 201 | - | 400 |
| PUT /api/sites/{id} | 200 | 404 | 400 |
| DELETE /api/sites/{id} | 204 | 404 | - |
| POST /api/sites/timeslots/book | 200 | 404 | 400 |

## File Checklist

✅ **Entities**
- [x] Court.cs (fixed SiteId type)
- [x] TimeSlot.cs (added CourtId)
- [x] Site.cs (using DateOnly for ClosedDays)

✅ **Configurations**
- [x] CourtConfiguration.cs (created)
- [x] SiteConfiguration.cs (updated)
- [x] TimeSlotConfiguration.cs (updated)

✅ **DTOs**
- [x] CourtResponse.cs (created)
- [x] CreateCourtRequest.cs (created)
- [x] SiteResponse.cs (updated)
- [x] CreateSiteRequest.cs (updated)
- [x] UpdateSiteRequest.cs (updated)
- [x] TimeSlotResponse.cs (updated)

✅ **Services**
- [x] SiteService.cs (rewritten)

✅ **Database**
- [x] Migration: AddCourtEntity

✅ **Tests**
- [x] SiteManagement.API.http (updated)

✅ **Documentation**
- [x] README.md (updated)
- [x] sitemanagement-implementation-summary.md (updated)
- [x] court-entity-integration.md (created)

## Next Steps

1. ✅ Build successful
2. ✅ Migration created
3. ⏭️ Run AppHost (F5) to test
4. ⏭️ Test API endpoints via HTTP file
5. ⏭️ Create frontend components for court management
6. ⏭️ Add court-specific business rules
7. ⏭️ Add unit tests

---

**Ready to use!** Press F5 in Visual Studio to start the application.
