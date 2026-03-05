# Schedule Feature Architecture

## Component Hierarchy

```
ScheduleComponent (Smart Component)
├── State Management (signals)
│   ├── selectedSiteId: signal<string>
│   ├── selectedWeekNumber: signal<number>
│   ├── daySchedules: signal<DaySchedule[]>
│   ├── loading: signal<boolean>
│   └── error: signal<string | null>
│
├── User Interactions
│   ├── onSiteSelected(siteId)
│   ├── goToPreviousWeek()
│   └── goToNextWeek()
│
└── WeeklyPlannerComponent (Presentation Component)
    ├── @Input() daySchedules: DaySchedule[]
    ├── @Input() weekNumber: number
    ├── @Input() canGoToPreviousWeek: boolean
    ├── @Input() canGoToNextWeek: boolean
    │
    ├── Desktop View
    │   └── ScheduleTableComponent
    │       └── Table for all 7 days
    │
    └── Mobile View
        ├── Navigation (2-day pairs)
        └── ScheduleTableComponent
            └── Table for 2 days
```

## Service Layer

```
ScheduleService
│
├── getAllSites(): Observable<SiteResponse[]>
│   └── Delegates to SiteFacadeService
│
└── getScheduleForWeek(siteId, weekNumber, numberOfWeeks): Observable<DaySchedule[]>
    │
    ├── Calls: SiteFacadeService.getSiteSchedule()
    │   └── Returns: TimeSlotResponse[] (raw API data)
    │
    └── Transforms via: transformToDaySchedules()
        │
        ├── Groups by date (yyyy-MM-dd)
        ├── Formats day names (e.g., "Monday")
        ├── Sorts slots by time within each day
        └── Sorts days by date
        │
        └── Returns: DaySchedule[] (presentation-ready)
```

## Data Models

### DaySchedule Interface
```typescript
interface DaySchedule {
  date: Date;              // The date for this day
  dayName: string;         // Formatted day name (e.g., "Monday")
  slots: TimeSlotResponse[]; // All time slots for this day, sorted by time
}
```

### TimeSlotResponse (from API)
```typescript
interface TimeSlotResponse {
  id: string;
  timeSlotNumber: number;
  courtId: string;
  weekNumber: number;
  bookState: BookState;    // undefined = Available
  dateTime: string;        // ISO 8601 datetime
}
```

### BookState Enum
```typescript
enum BookState {
  BookInProgress = 'BookInProgress',  // Orange
  Booked = 'Booked',                  // Red
  Paid = 'Paid',                      // Blue
  Played = 'Played'                   // Purple
}
// No bookState = Available (Green)
```

## Responsibilities by Layer

### Service Layer (ScheduleService)
✅ API communication
✅ Data transformation
✅ Business logic
✅ Date formatting
✅ Sorting and grouping
✅ Observable management

❌ NO presentation logic
❌ NO user interaction handling
❌ NO component state

### Smart Component (ScheduleComponent)
✅ State management (signals)
✅ User interaction handling
✅ Loading/error states
✅ Effect-based data loading
✅ Navigation logic

❌ NO data transformation
❌ NO date formatting
❌ NO API calls (delegates to service)

### Presentation Components (WeeklyPlannerComponent, ScheduleTableComponent)
✅ Display data (@Input)
✅ Emit events (@Output)
✅ Responsive layout
✅ CSS styling
✅ Navigation UI

❌ NO data transformation
❌ NO API calls
❌ NO state management
❌ NO business logic

## Data Flow Example

### Scenario: User Selects Week 10

```
1. User clicks "Next Week" button
   ↓
2. ScheduleComponent.goToNextWeek()
   - selectedWeekNumber.update(week => week + 1)
   ↓
3. Effect triggered (week changed)
   - loadSchedule(siteId, 10)
   ↓
4. ScheduleService.getScheduleForWeek(siteId, 10, 1)
   ↓
5. SiteFacadeService.getSiteSchedule(siteId, 10, 1)
   ↓
6. HTTP GET: /api/sites/{siteId}/schedule?weekNumber=10&numberOfWeeks=1
   ↓
7. API returns: TimeSlotResponse[]
   [
     { id: "1", dateTime: "2026-03-09T09:00:00", ... },
     { id: "2", dateTime: "2026-03-09T10:45:00", ... },
     { id: "3", dateTime: "2026-03-10T09:00:00", ... },
     ...
   ]
   ↓
8. ScheduleService.transformToDaySchedules()
   Groups & Sorts:
   [
     {
       date: Date(2026-03-09),
       dayName: "Monday",
       slots: [slot1, slot2, ...] // sorted by time
     },
     {
       date: Date(2026-03-10),
       dayName: "Tuesday",
       slots: [slot3, ...] // sorted by time
     },
     ...
   ]
   ↓
9. Observable emits: DaySchedule[]
   ↓
10. ScheduleComponent receives data
    - daySchedules.set(schedules)
    - loading.set(false)
   ↓
11. WeeklyPlannerComponent receives @Input
    - [daySchedules]="daySchedules()"
   ↓
12. ScheduleTableComponent renders table
    - Displays formatted data
    - Color-codes based on BookState
```

## Benefits of This Architecture

### 1. Testability
```typescript
// Service test (unit test)
it('should transform time slots to day schedules', () => {
  const timeSlots: TimeSlotResponse[] = [...];
  const result = service['transformToDaySchedules'](timeSlots);
  expect(result.length).toBe(7);
  expect(result[0].dayName).toBe('Monday');
});

// Component test (integration test)
it('should display schedule when site selected', () => {
  const mockSchedules: DaySchedule[] = [...];
  component.daySchedules.set(mockSchedules);
  expect(component.daySchedules().length).toBe(7);
});
```

### 2. Reusability
```typescript
// Can reuse in any component
import { DaySchedule, ScheduleService } from '@schedule/services';

export class AnotherComponent {
  private scheduleService = inject(ScheduleService);
  
  loadSchedule() {
    this.scheduleService.getScheduleForWeek(siteId, weekNum)
      .subscribe(schedules => {
        // Already transformed and ready to use
      });
  }
}
```

### 3. Maintainability
```typescript
// Need to change date format? Only one place:
// ScheduleService.transformToDaySchedules()
dayName: format(date, 'EEEE, MMMM d') // "Monday, March 9"

// Need to add filtering? Only in service:
private transformToDaySchedules(slots: TimeSlotResponse[]): DaySchedule[] {
  return slots
    .filter(slot => /* new filter logic */)
    ./* rest of transformation */;
}
```

## Anti-Patterns Avoided

❌ **Data transformation in components**
- Violates SRP
- Hard to test
- Code duplication

❌ **Presentation logic in services**
- Tight coupling
- Hard to change UI
- Violates separation of concerns

❌ **Direct API calls from components**
- No abstraction
- Hard to mock
- Tight coupling to API structure

## Best Practices Applied

✅ **Single Responsibility Principle**
- Each class has one reason to change

✅ **Dependency Inversion Principle**
- Components depend on abstractions (interfaces)
- Service provides abstraction over API

✅ **Open/Closed Principle**
- Open for extension (new transformations)
- Closed for modification (existing logic stable)

✅ **Interface Segregation**
- DaySchedule is focused and minimal
- Components only receive what they need

✅ **DRY (Don't Repeat Yourself)**
- Transformation logic in one place
- Single source of truth for DaySchedule

