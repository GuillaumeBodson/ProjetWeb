# TimeSlot Business Rules Update - Implementation Summary

## Overview

The SiteManagement microservice has been updated with significant changes to how time slots are managed:

1. **Time slots are no longer pre-created** - They are created on-demand when a booking is made
2. **BookState enum** replaces the simple boolean `IsBooked` flag
3. **WeekNumber** added to support weekly recurring bookings
4. **Smart update logic** - Only removes time slots when courts are removed, not when schedule changes

## Business Rules

### Rule 1: On-Demand Time Slot Creation

**Rationale:** Avoid table overload by not creating millions of unused time slots.

**Before:**
```
Site creation → Creates all time slots for all courts, all days, all weeks
Example: 3 courts × 5 days × 8 slots × 52 weeks = 6,240 records created immediately
```

**After:**
```
Site creation → Creates only site, courts, and planned days
Time slots created only when someone books → Minimal database footprint
Example: 3 courts × 5 days × 0 slots = 0 time slot records until booking
```

### Rule 2: BookState Enum

**Purpose:** Track the booking lifecycle, not just booked/not booked.

```csharp
public enum BookState
{
    BookInProgress,  // User has started booking but not confirmed
    Booked,          // Booking confirmed but not paid
    Payed,           // Payment received (French: "Payé")
    Plaid            // Alternative payment state (French: "Plaid")
}
```

**Workflow:**
```
No record → BookInProgress → Booked → Payed/Plaid
```

**Key Point:** If a time slot doesn't exist in the database, it's **available**.

### Rule 3: WeekNumber for Recurring Bookings

**Purpose:** Support weekly recurring bookings.

```csharp
public class TimeSlot
{
    public int WeekNumber { get; set; }  // 1-53 (ISO week numbers)
}
```

**Example:**
- Week 1 (Jan 1-7): Court 1, Monday, Slot 3 → One time slot record
- Week 2 (Jan 8-14): Court 1, Monday, Slot 3 → Different time slot record
- Week 52: Court 1, Monday, Slot 3 → Yet another time slot record

**Unique Constraint:** `(PlannedDayId, TimeSlotNumber, CourtId, WeekNumber)`

### Rule 4: Smart Update Logic

**Before:**
```csharp
// Old approach: Delete everything and recreate
UpdateSite → Delete all courts → Delete all time slots → Recreate everything
```

**After:**
```csharp
// New approach: Only delete time slots when courts are removed
UpdateSite → 
  IF court removed THEN delete that court's time slots
  ELSE keep existing time slots
  
Schedule changes (adding/removing planned days) → Keep time slots intact
```

**Rationale:**
- Preserve existing bookings when schedule changes
- Only remove bookings when the resource (court) is physically removed
- Example: If you change Monday from 8 slots to 10 slots, existing bookings for slots 1-8 remain

## Database Schema Changes

### TimeSlot Table

**Before:**
```sql
CREATE TABLE TimeSlots (
    Id uniqueidentifier PRIMARY KEY,
    PlannedDayId uniqueidentifier NOT NULL,
    CourtId uniqueidentifier NOT NULL,
    TimeSlotNumber int NOT NULL,
    IsBooked bit NOT NULL DEFAULT 0,
    UNIQUE (PlannedDayId, TimeSlotNumber, CourtId)
)
```

**After:**
```sql
CREATE TABLE TimeSlots (
    Id uniqueidentifier PRIMARY KEY,
    PlannedDayId uniqueidentifier NOT NULL,
    CourtId uniqueidentifier NOT NULL,
    TimeSlotNumber int NOT NULL,
    BookState nvarchar(50) NOT NULL,  -- Enum stored as string
    WeekNumber int NOT NULL,           -- NEW
    UNIQUE (PlannedDayId, TimeSlotNumber, CourtId, WeekNumber)
)
```

### Migration Impact

⚠️ **WARNING: This migration will drop and recreate the `TimeSlots` table, losing all existing bookings.**

**Migration:** `UpdateTimeSlotWithBookStateAndWeekNumber`

**Changes:**
1. Drops `IsBooked` column
2. Adds `BookState` column (nvarchar)
3. Adds `WeekNumber` column (int)
4. Updates unique constraint to include `WeekNumber`

## API Changes

### BookTimeSlotRequest

**Before:**
```csharp
public record BookTimeSlotRequest(
    Guid TimeSlotId,
    bool IsBooked
);
```

**After:**
```csharp
public record BookTimeSlotRequest(
    Guid PlannedDayId,
    Guid CourtId,
    int TimeSlotNumber,    // 1-100
    int WeekNumber,        // 1-53
    BookState BookState
);
```

**Why the change?**
- No more `TimeSlotId` because time slots don't exist until booking
- Client must specify exactly which slot they want to book
- System creates the time slot if it doesn't exist

### TimeSlotResponse

**Before:**
```csharp
public record TimeSlotResponse(
    Guid Id,
    int TimeSlotNumber,
    Guid CourtId,
    bool IsBooked
);
```

**After:**
```csharp
public record TimeSlotResponse(
    Guid Id,
    int TimeSlotNumber,
    Guid CourtId,
    int WeekNumber,        // NEW
    BookState BookState    // Replaces IsBooked
);
```

## Service Layer Changes

### CreateAsync (Site Creation)

**Before:**
```csharp
// Created time slots for all courts, all days
foreach (var court in courts)
{
    for (int i = 1; i <= numberOfSlots; i++)
    {
        var timeSlot = new TimeSlot { ... };
        context.TimeSlots.Add(timeSlot);
    }
}
```

**After:**
```csharp
// Only creates courts and planned days
// No time slots created
foreach (var scheduleRequest in request.Schedule)
{
    var plannedDay = new PlannedDay { ... };
    context.PlannedDays.Add(plannedDay);
    // No time slot creation here
}
```

### UpdateAsync (Site Update)

**Before:**
```csharp
// Deleted everything
context.Courts.RemoveRange(existingCourts);  // ❌ Deletes all courts
context.TimeSlots.RemoveRange(allTimeSlots); // ❌ Deletes all bookings
```

**After:**
```csharp
// Only deletes removed courts and their time slots
var courtsToRemove = existingCourts
    .Where(c => !newCourtNumbers.Contains(c.Number))
    .ToList();

if (courtsToRemove.Count > 0)
{
    var timeSlotsToRemove = context.TimeSlots
        .Where(ts => courtIdsToRemove.Contains(ts.CourtId))
        .ToList();
    
    context.TimeSlots.RemoveRange(timeSlotsToRemove);  // ✅ Only removed courts' slots
    context.Courts.RemoveRange(courtsToRemove);         // ✅ Only removed courts
}

// Schedule changes don't affect existing time slots
```

### BookTimeSlotAsync (New Logic)

**NEW:** Creates time slot if it doesn't exist

```csharp
public async Task<TimeSlotResponse?> BookTimeSlotAsync(BookTimeSlotRequest request, ...)
{
    // Validate planned day and court exist
    var plannedDay = await context.PlannedDays.FindAsync([request.PlannedDayId]);
    var court = await context.Courts.FindAsync([request.CourtId]);
    
    // Try to find existing time slot
    var timeSlot = await context.TimeSlots
        .FirstOrDefaultAsync(ts =>
            ts.PlannedDayId == request.PlannedDayId &&
            ts.CourtId == request.CourtId &&
            ts.TimeSlotNumber == request.TimeSlotNumber &&
            ts.WeekNumber == request.WeekNumber);
    
    if (timeSlot is null)
    {
        // CREATE on-demand
        timeSlot = new TimeSlot
        {
            PlannedDayId = request.PlannedDayId,
            CourtId = request.CourtId,
            TimeSlotNumber = request.TimeSlotNumber,
            WeekNumber = request.WeekNumber,
            BookState = request.BookState
        };
        context.TimeSlots.Add(timeSlot);
    }
    else
    {
        // UPDATE existing
        timeSlot.BookState = request.BookState;
    }
    
    await context.SaveChangesAsync();
    return new TimeSlotResponse(...);
}
```

## Usage Examples

### Create a Site

**No time slots created:**

```http
POST /api/sites
{
    "name": "Tennis Club",
    "courts": [
        { "number": 1 },
        { "number": 2 }
    ],
    "schedule": [
        { "dayOfWeek": 1, "numberOfTimeSlots": 8 }
    ]
}
```

**Result:**
- ✅ Site created
- ✅ 2 courts created
- ✅ 1 planned day created (Monday, 8 slots)
- ⚠️ 0 time slots created (will be created on booking)

### Book a Time Slot

**First booking for this slot:**

```http
POST /api/sites/timeslots/book
{
    "plannedDayId": "...",
    "courtId": "...",
    "timeSlotNumber": 3,
    "weekNumber": 1,
    "bookState": "BookInProgress"
}
```

**Result:**
- ✅ Time slot **created** with BookInProgress state
- System checks if slot already exists → No → Creates new record

### Update Booking State

**Move from BookInProgress to Booked:**

```http
POST /api/sites/timeslots/book
{
    "plannedDayId": "...",  // Same as before
    "courtId": "...",        // Same as before
    "timeSlotNumber": 3,     // Same as before
    "weekNumber": 1,         // Same as before
    "bookState": "Booked"    // Changed state
}
```

**Result:**
- ✅ Time slot **updated** to Booked state
- System finds existing slot → Updates BookState

### Update Site (Remove Court)

```http
PUT /api/sites/{id}
{
    "name": "Tennis Club",
    "courts": [
        { "number": 1 }  // Court 2 removed
    ],
    "schedule": [...]
}
```

**Result:**
- ✅ Court 2 removed
- ✅ All bookings (time slots) for Court 2 removed
- ✅ Court 1 bookings preserved

### Update Site (Change Schedule)

```http
PUT /api/sites/{id}
{
    "name": "Tennis Club",
    "courts": [
        { "number": 1 },
        { "number": 2 }  // Both courts kept
    ],
    "schedule": [
        { "dayOfWeek": 1, "numberOfTimeSlots": 10 }  // Changed from 8 to 10
    ]
}
```

**Result:**
- ✅ Planned day updated (now allows 10 slots instead of 8)
- ✅ **All existing bookings preserved** (bookings for slots 1-8 remain)
- ℹ️ Slots 9-10 are now available for booking (will be created on-demand)

## Performance Implications

### Database Size

**Before:**
```
100 sites × 3 courts × 5 days × 8 slots × 52 weeks = 624,000 time slot records
(Most never booked → wasted storage)
```

**After:**
```
Only booked slots exist in database
Example: 10% booking rate = 62,400 records (10× smaller)
```

### Query Performance

**Before:**
- Large table scans
- Indexes on millions of rows
- Slow queries for available slots (NOT IsBooked)

**After:**
- Smaller table
- Faster queries
- Available slots = "doesn't exist in DB" (no query needed for availability check)

### Trade-offs

**Pros:**
- ✅ Smaller database
- ✅ Faster queries
- ✅ Less storage cost
- ✅ Easier to scale

**Cons:**
- ⚠️ INSERT on first booking (slightly slower)
- ⚠️ Can't pre-analyze all future availability (but can calculate it)
- ⚠️ More complex booking logic (must check existence)

## Breaking Changes

### ⚠️ API Breaking Changes

1. **BookTimeSlotRequest structure completely changed**
   - Old: `{ timeSlotId, isBooked }`
   - New: `{ plannedDayId, courtId, timeSlotNumber, weekNumber, bookState }`

2. **TimeSlotResponse includes WeekNumber**
   - Old: `{ id, timeSlotNumber, courtId, isBooked }`
   - New: `{ id, timeSlotNumber, courtId, weekNumber, bookState }`

3. **BookState enum instead of boolean**
   - Old: `true/false`
   - New: `BookInProgress | Booked | Payed | Plaid`

### Client Impact

**Frontend/Mobile must update:**
1. Booking UI to include week number selection
2. Handle BookState enum instead of boolean
3. Change booking API call parameters
4. Display booking states correctly
5. Handle "available" state (no record exists)

## Migration Strategy

### Option 1: Fresh Start (Recommended for Dev/Test)

```powershell
# Drop database and recreate
dotnet ef database drop --project SiteManagement.API --startup-project SiteManagement.API
dotnet ef database update --project SiteManagement.API --startup-project SiteManagement.API
```

### Option 2: Data Migration (Production)

```sql
-- Backup existing bookings
SELECT * INTO TimeSlots_Backup FROM TimeSlots WHERE IsBooked = 1;

-- Apply migration
-- (drops and recreates TimeSlots table)

-- Manually migrate booked slots
INSERT INTO TimeSlots (Id, PlannedDayId, CourtId, TimeSlotNumber, WeekNumber, BookState)
SELECT 
    NEWID(),
    PlannedDayId,
    CourtId,
    TimeSlotNumber,
    1 as WeekNumber,  -- Assume all old bookings are week 1
    'Booked' as BookState
FROM TimeSlots_Backup
WHERE IsBooked = 1;
```

## Testing Checklist

- [ ] Create site without courts → Should succeed (0 time slots)
- [ ] Create site with courts → Should succeed (0 time slots)
- [ ] Book time slot (first time) → Should create time slot with BookInProgress
- [ ] Book same slot again → Should update existing to Booked
- [ ] Book different week → Should create separate time slot
- [ ] Get site → Should return only booked time slots
- [ ] Update site (remove court) → Should delete court's time slots
- [ ] Update site (change schedule) → Should preserve existing bookings
- [ ] Update site (keep all courts) → Should preserve all bookings

## Documentation Files Updated

- [x] `SiteManagement.API/BL/Models/BookTimeSlotRequest.cs`
- [x] `SiteManagement.API/BL/Models/TimeSlotResponse.cs`
- [x] `SiteManagement.API/BL/Services/SiteService.cs`
- [x] `SiteManagement.API/DAL/Configurations/TimeSlotConfiguration.cs`
- [x] `SiteManagement.API/DAL/Entities/TimeSlot.cs`
- [x] `SiteManagement.API/SiteManagement.API.http`
- [x] Migration: `UpdateTimeSlotWithBookStateAndWeekNumber`

## Summary

✅ **Time slots created on-demand** (Rule 1)
✅ **BookState enum** for booking lifecycle (Rule 2)
✅ **WeekNumber** for recurring bookings (Rule 3)
✅ **Smart update** - only removes time slots when courts removed (Rule 4)
✅ **Migration created**
✅ **Build successful**
✅ **Documentation complete**

**Ready to test!** 🚀
