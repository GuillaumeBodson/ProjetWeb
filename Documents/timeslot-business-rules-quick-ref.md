# TimeSlot Business Rules - Quick Reference

## Core Principles

### 1. 📌 On-Demand Creation
**Time slots are NOT pre-created. They only exist when booked.**

```
Available = No database record
Booking = Create time slot record with BookState
```

### 2. 📊 BookState Lifecycle

```
No Record → BookInProgress → Booked → Payed/Plaid
(Available)   (Reserved)      (Confirmed) (Paid)
```

### 3. 📅 Week Numbers
Each time slot is tied to a specific week (1-53).

```
Week 1: Court 1, Monday, Slot 3 → TimeSlot record 1
Week 2: Court 1, Monday, Slot 3 → TimeSlot record 2
```

### 4. 🔄 Smart Updates
Schedule changes preserve bookings. Only court removal deletes bookings.

```
❌ Old: Update anything → Delete all time slots
✅ New: Remove court → Delete only that court's time slots
✅ New: Change schedule → Keep all time slots
```

## Entity Structure

```csharp
public class TimeSlot
{
    public Guid Id { get; set; }
    public Guid PlannedDayId { get; set; }
    public Guid CourtId { get; set; }
    public int TimeSlotNumber { get; set; }
    public BookState BookState { get; set; }  // Not boolean!
    public int WeekNumber { get; set; }        // NEW
}

public enum BookState
{
    BookInProgress,
    Booked,
    Payed,
    Plaid
}
```

## API Requests

### Book a Time Slot

```http
POST /api/sites/timeslots/book
Content-Type: application/json

{
    "plannedDayId": "guid",
    "courtId": "guid",
    "timeSlotNumber": 3,
    "weekNumber": 1,
    "bookState": "BookInProgress"
}
```

**What happens:**
1. System checks if time slot exists (PlannedDayId + CourtId + TimeSlotNumber + WeekNumber)
2. If not exists → **CREATE** with specified BookState
3. If exists → **UPDATE** BookState

### Update Booking State

```http
POST /api/sites/timeslots/book
{
    "plannedDayId": "same-as-before",
    "courtId": "same-as-before",
    "timeSlotNumber": 3,
    "weekNumber": 1,
    "bookState": "Booked"  // Changed from BookInProgress
}
```

**Result:** Updates existing time slot to new state

### Create Site

```http
POST /api/sites
{
    "name": "Sports Center",
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
- ✅ Courts created
- ✅ Planned days created
- ⚠️ **0 time slots created** (created on booking)

### Update Site (Remove Court)

```http
PUT /api/sites/{id}
{
    "name": "Sports Center",
    "courts": [
        { "number": 1 }  // Court 2 removed
    ],
    "schedule": [...]
}
```

**Result:**
- ✅ Court 2 deleted
- ✅ All Court 2 bookings deleted
- ✅ Court 1 bookings preserved

### Update Site (Change Schedule)

```http
PUT /api/sites/{id}
{
    "name": "Sports Center",
    "courts": [
        { "number": 1 },
        { "number": 2 }
    ],
    "schedule": [
        { "dayOfWeek": 1, "numberOfTimeSlots": 10 }  // Was 8
    ]
}
```

**Result:**
- ✅ Schedule updated
- ✅ **All bookings preserved** (for both courts)

## Database Queries

### Check if Time Slot is Available

```csharp
// Available = Does not exist in database
var isAvailable = !await context.TimeSlots.AnyAsync(ts =>
    ts.PlannedDayId == plannedDayId &&
    ts.CourtId == courtId &&
    ts.TimeSlotNumber == slotNumber &&
    ts.WeekNumber == weekNumber);
```

### Get All Bookings for a Week

```csharp
var bookings = await context.TimeSlots
    .Where(ts => ts.WeekNumber == weekNumber)
    .ToListAsync();
```

### Get Bookings for Specific Court

```csharp
var courtBookings = await context.TimeSlots
    .Where(ts => ts.CourtId == courtId)
    .OrderBy(ts => ts.WeekNumber)
    .ThenBy(ts => ts.TimeSlotNumber)
    .ToListAsync();
```

### Find BookInProgress (Abandoned Carts)

```csharp
var abandonedBookings = await context.TimeSlots
    .Where(ts => ts.BookState == BookState.BookInProgress)
    .ToListAsync();
```

## Validation Rules

| Field | Rule |
|-------|------|
| PlannedDayId | Must exist in PlannedDays table |
| CourtId | Must exist in Courts table |
| TimeSlotNumber | 1 <= value <= PlannedDay.NumberOfTimeSplots |
| WeekNumber | 1 <= value <= 53 (ISO week number) |
| BookState | Must be valid enum value |
| Unique | (PlannedDayId, CourtId, TimeSlotNumber, WeekNumber) |

## Performance Characteristics

### Storage Savings

| Scenario | Old Approach | New Approach | Savings |
|----------|-------------|--------------|---------|
| 100 sites, 3 courts, 5 days, 8 slots, 52 weeks | 624,000 records | ~62,400 (10% booked) | 90% |
| 10 sites, 5 courts, 7 days, 10 slots, 52 weeks | 182,000 records | ~18,200 (10% booked) | 90% |

### Query Performance

**Old:**
- Full table scan on 624,000 rows to find available slots
- WHERE IsBooked = 0

**New:**
- Check existence (fast)
- If not exists → Available
- No rows to scan for availability

## Migration Impact

⚠️ **Breaking Change:** Existing time slots will be lost

### Before Migration

```sql
TimeSlots
- Id: uniqueidentifier
- PlannedDayId: uniqueidentifier
- CourtId: uniqueidentifier
- TimeSlotNumber: int
- IsBooked: bit
```

### After Migration

```sql
TimeSlots
- Id: uniqueidentifier
- PlannedDayId: uniqueidentifier
- CourtId: uniqueidentifier
- TimeSlotNumber: int
- BookState: nvarchar(50)  -- Enum
- WeekNumber: int          -- NEW
```

### Migrating Data (If Needed)

```sql
-- Backup old bookings
SELECT * INTO TimeSlots_Backup 
FROM TimeSlots 
WHERE IsBooked = 1;

-- After migration, restore as:
INSERT INTO TimeSlots (Id, PlannedDayId, CourtId, TimeSlotNumber, WeekNumber, BookState)
SELECT 
    NEWID(),
    PlannedDayId,
    CourtId,
    TimeSlotNumber,
    1 as WeekNumber,
    'Booked' as BookState
FROM TimeSlots_Backup;
```

## Code Examples

### Book a Time Slot (Service Layer)

```csharp
public async Task<TimeSlotResponse?> BookTimeSlotAsync(
    BookTimeSlotRequest request, 
    CancellationToken cancellationToken = default)
{
    // Find or create time slot
    var timeSlot = await context.TimeSlots
        .FirstOrDefaultAsync(ts =>
            ts.PlannedDayId == request.PlannedDayId &&
            ts.CourtId == request.CourtId &&
            ts.TimeSlotNumber == request.TimeSlotNumber &&
            ts.WeekNumber == request.WeekNumber,
            cancellationToken);
    
    if (timeSlot is null)
    {
        // Create new (first booking)
        timeSlot = new TimeSlot
        {
            Id = Guid.NewGuid(),
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
        // Update existing
        timeSlot.BookState = request.BookState;
    }
    
    await context.SaveChangesAsync(cancellationToken);
    
    return new TimeSlotResponse(
        timeSlot.Id,
        timeSlot.TimeSlotNumber,
        timeSlot.CourtId,
        timeSlot.WeekNumber,
        timeSlot.BookState);
}
```

### Check Availability (Frontend Logic)

```typescript
// TypeScript example
async function isTimeSlotAvailable(
    plannedDayId: string,
    courtId: string,
    timeSlotNumber: number,
    weekNumber: number
): Promise<boolean> {
    // Get site with all time slots
    const site = await getSiteById(siteId);
    
    // Find planned day
    const plannedDay = site.schedule.find(pd => pd.id === plannedDayId);
    if (!plannedDay) return false;
    
    // Check if time slot exists (booked)
    const isBooked = plannedDay.timeSlots.some(ts =>
        ts.courtId === courtId &&
        ts.timeSlotNumber === timeSlotNumber &&
        ts.weekNumber === weekNumber
    );
    
    // Available if not in the list
    return !isBooked;
}
```

## Troubleshooting

### Issue: "Time slot not found"
**Cause:** Trying to update a time slot that doesn't exist
**Solution:** Use the booking endpoint which creates if not exists

### Issue: "Unique constraint violation"
**Cause:** Trying to create duplicate time slot (same PlannedDayId + CourtId + TimeSlotNumber + WeekNumber)
**Solution:** Check if time slot exists first, or use upsert logic

### Issue: "TimeSlotNumber out of range"
**Cause:** Requesting slot number > PlannedDay.NumberOfTimeSplots
**Solution:** Validate against planned day configuration

### Issue: "Bookings disappeared after schedule update"
**Cause:** Using old version that deletes all time slots on update
**Solution:** Update to latest version with smart update logic

## Testing Scenarios

### Scenario 1: First Booking
```http
POST /timeslots/book
{ plannedDayId, courtId, timeSlotNumber: 1, weekNumber: 1, bookState: "BookInProgress" }

Expected: 
- Time slot created
- Returns 200 with time slot details
```

### Scenario 2: Update Booking
```http
POST /timeslots/book
{ plannedDayId, courtId, timeSlotNumber: 1, weekNumber: 1, bookState: "Booked" }

Expected:
- Existing time slot updated
- BookState changed to "Booked"
```

### Scenario 3: Different Week
```http
POST /timeslots/book
{ plannedDayId, courtId, timeSlotNumber: 1, weekNumber: 2, bookState: "BookInProgress" }

Expected:
- NEW time slot created (week 2)
- Week 1 booking unaffected
```

### Scenario 4: Remove Court
```http
PUT /sites/{id}
{ courts: [{ number: 1 }] }  // Court 2 removed

Expected:
- All Court 2 time slots deleted
- Court 1 time slots preserved
```

### Scenario 5: Change Schedule
```http
PUT /sites/{id}
{ schedule: [{ dayOfWeek: 1, numberOfTimeSlots: 10 }] }  // Was 8

Expected:
- PlannedDay updated
- All existing time slots preserved
- Slots 9-10 now bookable
```

## Summary

✅ **On-Demand**: Time slots created only when booked
✅ **BookState**: Track booking lifecycle, not just yes/no
✅ **WeekNumber**: Support recurring weekly bookings
✅ **Smart Updates**: Preserve bookings unless court removed
✅ **Performance**: 90% database size reduction
✅ **Scalability**: Better for high-volume systems

---

**See Also:**
- `timeslot-business-rules-update.md` - Full detailed documentation
- `SiteManagement.API.http` - HTTP test examples
- `SiteService.cs` - Implementation details
