# Seven-Day Schedule Business Rule - Implementation Summary

## Overview

The SiteManagement microservice has been updated with a new business rule: **Every site must have exactly 7 PlannedDays** (one for each day of the week). This simplifies the data model and ensures consistency across all sites.

## Business Rule

### Rule: All Sites Have 7 Days

**Every site MUST have exactly 7 PlannedDays, representing all days of the week (Sunday through Saturday).**

**Rationale:**
- Simplifies the data model
- Ensures consistency (no sites with missing days)
- Makes scheduling predictable
- Days with 0 time slots represent "closed" days
- Easier to display in UI (always show all 7 days)

## What Changed

### Before

```csharp
// Old: Sites could have any number of planned days
{
    "name": "Tennis Club",
    "schedule": [
        { "dayOfWeek": 1, "numberOfTimeSlots": 8 },  // Monday only
        { "dayOfWeek": 3, "numberOfTimeSlots": 8 }   // Wednesday only
    ]
}
```

**Problems:**
- ❌ Inconsistent data (some sites have 2 days, some have 5)
- ❌ Frontend must handle missing days
- ❌ Unclear if missing day = closed or forgotten
- ❌ Hard to update schedule (delete/recreate all days)

### After

```csharp
// New: All sites MUST have exactly 7 planned days
{
    "name": "Tennis Club",
    "schedule": [
        { "dayOfWeek": 0, "numberOfTimeSlots": 0 },   // Sunday - CLOSED
        { "dayOfWeek": 1, "numberOfTimeSlots": 10 },  // Monday - 10 slots
        { "dayOfWeek": 2, "numberOfTimeSlots": 10 },  // Tuesday - 10 slots
        { "dayOfWeek": 3, "numberOfTimeSlots": 10 },  // Wednesday - 10 slots
        { "dayOfWeek": 4, "numberOfTimeSlots": 10 },  // Thursday - 10 slots
        { "dayOfWeek": 5, "numberOfTimeSlots": 8 },   // Friday - 8 slots
        { "dayOfWeek": 6, "numberOfTimeSlots": 0 }    // Saturday - CLOSED
    ]
}
```

**Benefits:**
- ✅ Consistent data model
- ✅ Clear intent (`numberOfTimeSlots: 0` = closed)
- ✅ Easy to update (just change numbers)
- ✅ Simple frontend display (always 7 days)
- ✅ PlannedDays never deleted (only updated)

## Implementation Changes

### 1. Site Entity

**Before:**
```csharp
public class Site
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public HashSet<DateOnly> ClosedDays { get; set; } = [];
    public HashSet<PlannedDay> Schedule { get; set; } = [];  // Navigation property
}
```

**After:**
```csharp
public class Site
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public HashSet<DateOnly> ClosedDays { get; set; } = [];
    // Schedule property removed (implicit - always 7 days)
}
```

**Why removed?**
- Not needed as navigation property
- PlannedDays always exist (fetched via SiteId foreign key)
- Simplifies entity

### 2. CreateSiteRequest & UpdateSiteRequest

**Before:**
```csharp
public record CreateSiteRequest(
    string Name,
    IReadOnlyCollection<DateOnly>? ClosedDays,
    IReadOnlyCollection<CreateCourtRequest>? Courts,
    IReadOnlyCollection<CreatePlannedDayRequest>? Schedule  // Optional
);
```

**After:**
```csharp
public record CreateSiteRequest(
    [Required]
    string Name,
    IReadOnlyCollection<DateOnly>? ClosedDays,
    IReadOnlyCollection<CreateCourtRequest>? Courts,
    
    [Required]
    [MinLength(7)]
    [MaxLength(7)]
    IReadOnlyCollection<CreatePlannedDayRequest> Schedule  // Required, exactly 7
)
{
    // Validation method
    public bool HasAllDaysOfWeek()
    {
        if (Schedule.Count != 7) return false;
        var distinctDays = Schedule.Select(s => s.DayOfWeek).Distinct().Count();
        return distinctDays == 7;
    }
}
```

**Changes:**
- ✅ `Schedule` is now **required** (not nullable)
- ✅ Must contain **exactly 7 items**
- ✅ Must contain **all 7 unique days of week** (no duplicates)
- ✅ Validation method ensures all days present

### 3. CreateAsync (Site Creation)

**Before:**
```csharp
// Created planned days only if Schedule provided
if (request.Schedule is not null)
{
    foreach (var scheduleRequest in request.Schedule)
    {
        var plannedDay = new PlannedDay { ... };
        context.PlannedDays.Add(plannedDay);
    }
}
```

**After:**
```csharp
// Validate that all 7 days are present
if (!request.HasAllDaysOfWeek())
{
    throw new ArgumentException(
        "Schedule must contain exactly 7 days (one for each day of the week) with no duplicates.");
}

// Create all 7 planned days (ordered by day of week)
foreach (var scheduleRequest in request.Schedule.OrderBy(s => s.DayOfWeek))
{
    var plannedDay = new PlannedDay
    {
        Id = Guid.NewGuid(),
        SiteId = site.Id,
        DayOfWeek = scheduleRequest.DayOfWeek,
        NumberOfTimeSplots = scheduleRequest.NumberOfTimeSlots
    };
    context.PlannedDays.Add(plannedDay);
}
```

**Changes:**
- ✅ **Validates** all 7 days present before creating
- ✅ Throws exception if validation fails
- ✅ Orders by day of week for consistency

### 4. UpdateAsync (Site Update)

**Before:**
```csharp
// DELETED all planned days and recreated them
context.PlannedDays.RemoveRange(existingPlannedDays);

// Recreate from scratch
foreach (var scheduleRequest in request.Schedule)
{
    var plannedDay = new PlannedDay { ... };
    context.PlannedDays.Add(plannedDay);
}
```

**After:**
```csharp
// Validate that all 7 days are present
if (!request.HasAllDaysOfWeek())
{
    throw new ArgumentException(
        "Schedule must contain exactly 7 days (one for each day of the week) with no duplicates.");
}

// UPDATE existing planned days (no delete/recreate)
var existingPlannedDays = await context.PlannedDays
    .Where(pd => pd.SiteId == site.Id)
    .ToListAsync();

var existingByDayOfWeek = existingPlannedDays.ToDictionary(pd => pd.DayOfWeek);

foreach (var scheduleRequest in request.Schedule)
{
    if (existingByDayOfWeek.TryGetValue(scheduleRequest.DayOfWeek, out var existing))
    {
        // Update existing (only NumberOfTimeSplots changes)
        existing.NumberOfTimeSplots = scheduleRequest.NumberOfTimeSlots;
    }
    else
    {
        // Create missing day (should not happen if validation passed)
        var newDay = new PlannedDay { ... };
        context.PlannedDays.Add(newDay);
    }
}
```

**Changes:**
- ✅ **No longer deletes** planned days
- ✅ **Updates** NumberOfTimeSplots on existing days
- ✅ **Preserves** PlannedDay IDs (important for TimeSlot foreign keys)
- ✅ TimeSlots remain linked to same PlannedDay
- ✅ Failsafe: Creates missing days if somehow they don't exist

## Benefits

### 1. Simpler Data Model

**Before:**
```
Site
  ├─ PlannedDays (variable count: 0-7)
  │    Could be deleted/recreated
  │    TimeSlots orphaned on recreation
```

**After:**
```
Site
  ├─ PlannedDays (always exactly 7)
  │    Never deleted, only updated
  │    TimeSlots always valid
```

### 2. No Orphaned TimeSlots

**Before:**
```
Update Site → Delete PlannedDays → Create new PlannedDays
              ↓
         TimeSlots references old (deleted) PlannedDay IDs
         Must manually cascade delete TimeSlots
```

**After:**
```
Update Site → Update PlannedDays (same IDs)
              ↓
         TimeSlots still reference valid PlannedDay IDs
         No cascade delete needed
```

### 3. Frontend Simplification

**Before:**
```typescript
// Frontend must handle missing days
const mondaySchedule = site.schedule.find(s => s.dayOfWeek === 1);
if (mondaySchedule) {
    // Monday is open
} else {
    // Monday is... closed? Or just not configured?
}
```

**After:**
```typescript
// Frontend always has all 7 days
const mondaySchedule = site.schedule.find(s => s.dayOfWeek === 1)!;
if (mondaySchedule.numberOfTimeSlots > 0) {
    // Monday is open
} else {
    // Monday is explicitly closed
}
```

### 4. Clearer Business Logic

**Before:**
- Missing day = ???
- 0 slots = ???
- Hard to distinguish "closed" from "forgot to add"

**After:**
- All days present
- `numberOfTimeSlots: 0` = **explicitly closed**
- Clear intent

## Database Impact

### Migration: `EnforceSevenDayScheduleRule`

**Changes:**
- No schema changes (Site table unchanged)
- Only entity model change (removed Schedule navigation property)

**Existing Data:**
- Sites with < 7 PlannedDays will cause validation errors
- **Action Required:** Before migration, ensure all existing sites have 7 planned days

## Validation Rules

### At Creation

```csharp
// Validation in CreateAsync
if (!request.HasAllDaysOfWeek())
{
    throw new ArgumentException(
        "Schedule must contain exactly 7 days (one for each day of the week) with no duplicates.");
}
```

**Checks:**
1. Schedule contains exactly 7 items
2. All 7 days of week present (Sunday=0 through Saturday=6)
3. No duplicate days

### At Update

```csharp
// Same validation in UpdateAsync
if (!request.HasAllDaysOfWeek())
{
    throw new ArgumentException(
        "Schedule must contain exactly 7 days (one for each day of the week) with no duplicates.");
}
```

**Checks:**
1. Schedule contains exactly 7 items
2. All 7 days of week present
3. No duplicate days

## API Examples

### Create Site (All 7 Days Required)

```http
POST /api/sites
Content-Type: application/json

{
    "name": "Sports Complex",
    "courts": [
        { "number": 1 },
        { "number": 2 }
    ],
    "schedule": [
        { "dayOfWeek": 0, "numberOfTimeSlots": 0 },   // Sunday - CLOSED
        { "dayOfWeek": 1, "numberOfTimeSlots": 10 },  // Monday
        { "dayOfWeek": 2, "numberOfTimeSlots": 10 },  // Tuesday
        { "dayOfWeek": 3, "numberOfTimeSlots": 10 },  // Wednesday
        { "dayOfWeek": 4, "numberOfTimeSlots": 10 },  // Thursday
        { "dayOfWeek": 5, "numberOfTimeSlots": 8 },   // Friday
        { "dayOfWeek": 6, "numberOfTimeSlots": 0 }    // Saturday - CLOSED
    ]
}
```

### Update Site (Change Time Slots Only)

```http
PUT /api/sites/{id}
Content-Type: application/json

{
    "name": "Sports Complex",
    "courts": [
        { "number": 1 },
        { "number": 2 }
    ],
    "schedule": [
        { "dayOfWeek": 0, "numberOfTimeSlots": 0 },   // Still closed
        { "dayOfWeek": 1, "numberOfTimeSlots": 12 },  // Changed: 10 → 12
        { "dayOfWeek": 2, "numberOfTimeSlots": 12 },  // Changed: 10 → 12
        { "dayOfWeek": 3, "numberOfTimeSlots": 12 },  // Changed: 10 → 12
        { "dayOfWeek": 4, "numberOfTimeSlots": 12 },  // Changed: 10 → 12
        { "dayOfWeek": 5, "numberOfTimeSlots": 8 },   // Unchanged
        { "dayOfWeek": 6, "numberOfTimeSlots": 6 }    // Changed: 0 → 6 (now open!)
    ]
}
```

**Result:**
- ✅ PlannedDays updated (not deleted)
- ✅ Existing bookings preserved
- ✅ Saturday now open with 6 slots

### Invalid Request (Missing Days)

```http
POST /api/sites
Content-Type: application/json

{
    "name": "Invalid Site",
    "schedule": [
        { "dayOfWeek": 1, "numberOfTimeSlots": 8 },
        { "dayOfWeek": 2, "numberOfTimeSlots": 8 }
        // Missing 5 days!
    ]
}
```

**Response:**
```json
{
    "status": 400,
    "title": "Bad Request",
    "detail": "Schedule must contain exactly 7 days (one for each day of the week) with no duplicates."
}
```

## Migration Strategy

### For Existing Sites

If you have existing sites with < 7 PlannedDays:

**Option 1: Data Migration Script (Recommended)**

```sql
-- Find sites with missing planned days
DECLARE @siteId uniqueidentifier;

DECLARE site_cursor CURSOR FOR
SELECT Id FROM Sites;

OPEN site_cursor;
FETCH NEXT FROM site_cursor INTO @siteId;

WHILE @@FETCH_STATUS = 0
BEGIN
    -- Check each day of week (0-6)
    DECLARE @dayOfWeek int = 0;
    
    WHILE @dayOfWeek < 7
    BEGIN
        -- If planned day doesn't exist, create it
        IF NOT EXISTS (
            SELECT 1 FROM PlannedDays 
            WHERE SiteId = @siteId AND DayOfWeek = @dayOfWeek
        )
        BEGIN
            INSERT INTO PlannedDays (Id, SiteId, DayOfWeek, NumberOfTimeSplots)
            VALUES (NEWID(), @siteId, CAST(@dayOfWeek AS nvarchar(50)), 0);
        END
        
        SET @dayOfWeek = @dayOfWeek + 1;
    END
    
    FETCH NEXT FROM site_cursor INTO @siteId;
END

CLOSE site_cursor;
DEALLOCATE site_cursor;
```

**Option 2: Application-Level Fix**

Create a one-time migration service to add missing days:

```csharp
public class EnsureSevenDaysWorker : BackgroundService
{
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        var sites = await context.Sites.ToListAsync(stoppingToken);
        
        foreach (var site in sites)
        {
            var plannedDays = await context.PlannedDays
                .Where(pd => pd.SiteId == site.Id)
                .ToListAsync(stoppingToken);
            
            var existingDays = plannedDays.Select(pd => pd.DayOfWeek).ToHashSet();
            
            // Add missing days
            for (int day = 0; day < 7; day++)
            {
                var dayOfWeek = (DayOfWeek)day;
                if (!existingDays.Contains(dayOfWeek))
                {
                    context.PlannedDays.Add(new PlannedDay
                    {
                        Id = Guid.NewGuid(),
                        SiteId = site.Id,
                        DayOfWeek = dayOfWeek,
                        NumberOfTimeSplots = 0  // Default to closed
                    });
                }
            }
        }
        
        await context.SaveChangesAsync(stoppingToken);
    }
}
```

## Testing

### Test Cases

1. ✅ **Create site with all 7 days** → Success
2. ❌ **Create site with 6 days** → 400 Bad Request
3. ❌ **Create site with 8 days** → 400 Bad Request
4. ❌ **Create site with duplicate days** → 400 Bad Request
5. ✅ **Update site schedule** → PlannedDays updated, not deleted
6. ✅ **Update site with 0 slots on Sunday** → Sunday explicitly closed
7. ✅ **Update site to open Saturday** → Change from 0 to 6 slots

## Summary

✅ **Every site has exactly 7 PlannedDays**
✅ **PlannedDays never deleted** (only updated)
✅ **Validation enforced** at creation and update
✅ **Simpler data model**
✅ **Clearer business logic** (0 slots = closed)
✅ **TimeSlots always valid** (no orphaned records)
✅ **Frontend simplified** (always 7 days)

**Migration:** `EnforceSevenDayScheduleRule`

---

**Next Steps:**
1. Apply migration
2. Test with all 7 days
3. Update frontend to always send 7 days
4. Update documentation
