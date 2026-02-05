# Court Entity Integration - Update Summary

## Overview

The SiteManagement microservice has been updated to include the **Court** entity, which represents individual courts within a site. This update changes the time slot booking model from a simple per-day schedule to a **per-court-per-day** model.

## What Changed

### 1. New Entity: Court

```csharp
public class Court
{
    public Guid Id { get; set; }
    public int Number { get; set; }
    public Guid SiteId { get; set; }  // Changed from int to Guid
}
```

**Key Points:**
- Each court has a unique number within its site
- Courts are tied to a specific site
- Unique constraint on (SiteId, Number)

### 2. Updated Entity: TimeSlot

```csharp
public class TimeSlot
{
    public Guid Id { get; set; }
    public Guid PlannedDayId { get; set; }
    public Guid CourtId { get; set; }  // NEW
    public int TimeSlotNumber { get; set; }
    public bool IsBooked { get; set; }
}
```

**Key Points:**
- Now includes `CourtId` to link to a specific court
- Unique constraint changed from `(PlannedDayId, TimeSlotNumber)` to `(PlannedDayId, TimeSlotNumber, CourtId)`
- This allows the same time slot number on different courts

### 3. Updated Entity: Site

```csharp
public class Site
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public HashSet<DateOnly> ClosedDays { get; set; } = [];  // Changed from DateTime to DateOnly
    public HashSet<PlannedDay> Schedule { get; set; } = [];
}
```

**Key Points:**
- `ClosedDays` now uses `DateOnly` instead of `DateTime` (more semantic)
- No structural changes, but now related to Courts

## New Files Created

### Entity Configurations
- `SiteManagement.API/DAL/Configurations/CourtConfiguration.cs`

### DTOs
- `SiteManagement.API/BL/Models/CourtResponse.cs`
- `SiteManagement.API/BL/Models/CreateCourtRequest.cs`

### Migrations
- `SiteManagement.API/Migrations/AddCourtEntity.cs`

## Updated Files

### Entity Configurations
- `SiteManagement.API/DAL/Configurations/SiteConfiguration.cs` - Added Court relationship
- `SiteManagement.API/DAL/Configurations/TimeSlotConfiguration.cs` - Added CourtId to unique index

### DTOs
- `SiteManagement.API/BL/Models/SiteResponse.cs` - Added Courts collection
- `SiteManagement.API/BL/Models/CreateSiteRequest.cs` - Added Courts collection
- `SiteManagement.API/BL/Models/UpdateSiteRequest.cs` - Added Courts collection
- `SiteManagement.API/BL/Models/TimeSlotResponse.cs` - Added CourtId property

### Services
- `SiteManagement.API/BL/Services/SiteService.cs` - Complete rewrite to handle courts

### Testing
- `SiteManagement.API/SiteManagement.API.http` - Updated examples with courts

### Documentation
- `SiteManagement.API/README.md` - Updated schema and examples
- `Documents/sitemanagement-implementation-summary.md` - Updated data model

## How Time Slots Work Now

### Before (Without Courts)
```
Site: "Main Campus"
  PlannedDay: Monday
    TimeSlot 1 (9:00 AM)
    TimeSlot 2 (10:00 AM)
    TimeSlot 3 (11:00 AM)
```

**Total: 3 time slots per day**

### After (With Courts)
```
Site: "Main Campus"
  Court 1
  Court 2
  Court 3
  
  PlannedDay: Monday
    Court 1 - TimeSlot 1 (9:00 AM)
    Court 1 - TimeSlot 2 (10:00 AM)
    Court 1 - TimeSlot 3 (11:00 AM)
    Court 2 - TimeSlot 1 (9:00 AM)
    Court 2 - TimeSlot 2 (10:00 AM)
    Court 2 - TimeSlot 3 (11:00 AM)
    Court 3 - TimeSlot 1 (9:00 AM)
    Court 3 - TimeSlot 2 (10:00 AM)
    Court 3 - TimeSlot 3 (11:00 AM)
```

**Total: 9 time slots per day (3 courts × 3 slots)**

## API Changes

### Creating a Site

**Before:**
```json
{
    "name": "Main Campus",
    "schedule": [...]
}
```

**After:**
```json
{
    "name": "Main Campus",
    "courts": [
        { "number": 1 },
        { "number": 2 },
        { "number": 3 }
    ],
    "schedule": [...]
}
```

### Site Response

**Before:**
```json
{
    "id": "guid",
    "name": "Main Campus",
    "closedDays": ["2024-12-25"],
    "schedule": [
        {
            "timeSlots": [
                {
                    "id": "guid",
                    "timeSlotNumber": 1,
                    "isBooked": false
                }
            ]
        }
    ]
}
```

**After:**
```json
{
    "id": "guid",
    "name": "Main Campus",
    "closedDays": ["2024-12-25"],
    "courts": [
        { "id": "guid", "number": 1 },
        { "id": "guid", "number": 2 }
    ],
    "schedule": [
        {
            "timeSlots": [
                {
                    "id": "guid",
                    "timeSlotNumber": 1,
                    "courtId": "guid",
                    "isBooked": false
                }
            ]
        }
    ]
}
```

## Business Logic Changes

### Creating/Updating Sites

The `SiteService` now:
1. Creates courts first
2. For each planned day, creates time slots **for each court**
3. Example: 5 planned days × 3 courts × 8 time slots = 120 total time slots

### Deleting Sites

Cascade delete ensures:
1. Delete Site → Deletes all Courts
2. Delete Site → Deletes all PlannedDays
3. Delete PlannedDays → Deletes all TimeSlots

No orphaned records remain.

## Database Migration Notes

The migration `AddCourtEntity` does the following:
1. Creates `Courts` table
2. Adds `CourtId` column to `TimeSlots` table
3. Updates unique constraint on `TimeSlots`
4. **WARNING**: Existing data may be lost if you have time slots without courts

### Migration Strategy

If you have existing data:
1. **Backup your database first!**
2. Run the migration
3. Manually insert court records for existing sites
4. Update existing time slots with appropriate CourtId values

Or:
1. Clear the database
2. Run migrations
3. Re-seed with new data including courts

## Breaking Changes

### ⚠️ API Breaking Changes

1. **CreateSiteRequest** now requires `courts` property (can be null)
2. **UpdateSiteRequest** now requires `courts` property (can be null)
3. **SiteResponse** now includes `courts` array
4. **TimeSlotResponse** now includes `courtId` property
5. **SiteResponse.ClosedDays** changed from `DateTime[]` to `DateOnly[]`

### Client Impact

**Frontend/Mobile apps must update:**
- Add court selection UI
- Update site creation forms to include courts
- Update time slot display to show court information
- Handle `courtId` when booking time slots

## Testing

### Updated HTTP Tests

See `SiteManagement.API/SiteManagement.API.http` for updated examples:

1. Create site with 3 courts
2. Update site courts
3. View time slots per court

### Example Test Scenario

```http
### 1. Create site with courts
POST {{gateway}}/api/sites
{
    "name": "Tennis Club",
    "courts": [
        { "number": 1 },
        { "number": 2 }
    ],
    "schedule": [
        {
            "dayOfWeek": 1,
            "numberOfTimeSlots": 8
        }
    ]
}

### 2. Get site (should show 16 time slots: 2 courts × 8 slots)
GET {{gateway}}/api/sites/{id}

### 3. Book specific court's time slot
POST {{gateway}}/api/sites/timeslots/book
{
    "timeSlotId": "{slot-id-for-court-1}",
    "isBooked": true
}
```

## Future Enhancements

### Recommended Next Steps

1. **Add Court Details**
   - Court type (indoor/outdoor)
   - Surface type (clay, hard, grass)
   - Capacity/size

2. **Court-Specific Schedules**
   - Different time slots per court
   - Court-specific closed days

3. **Court Availability API**
   - GET `/api/sites/{siteId}/courts/{courtId}/availability`
   - Filter available courts by date/time

4. **Bulk Booking**
   - Book multiple courts at once
   - Recurring bookings

5. **Court Maintenance**
   - Mark courts as under maintenance
   - Block specific courts on specific days

## Rollback Instructions

If you need to rollback:

```powershell
# Remove the migration
dotnet ef migrations remove --project SiteManagement.API --startup-project SiteManagement.API

# Or revert to previous migration
dotnet ef database update PreviousMigrationName --project SiteManagement.API --startup-project SiteManagement.API
```

## Summary

✅ **Court entity fully integrated**
✅ **Time slots now linked to courts**
✅ **Cascade delete configured**
✅ **DTOs updated**
✅ **Service layer updated**
✅ **HTTP tests updated**
✅ **Documentation updated**
✅ **Migration created**
✅ **Build successful**

**The SiteManagement service now supports multi-court booking!** 🎾🏀⚽

---

**Questions or Issues?**

Check:
- `SiteManagement.API/README.md` - Full API documentation
- `Documents/sitemanagement-implementation-summary.md` - Complete implementation details
- `SiteManagement.API/SiteManagement.API.http` - Working examples
