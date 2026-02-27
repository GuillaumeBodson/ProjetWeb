# Schedule Table — Slot Cache Optimisation

## Feature Description

The `ScheduleTableComponent` (`schedule-table.component.ts`) renders a weekly schedule grid.
Each column is a `PlannedDay` (e.g. Monday, Wednesday) and each row is a time-slot index.
For every cell the template needs a `TimeSlotUI` object that contains:

- the formatted start and end times of the slot
- whether the slot is available or already booked
- the booking state label (`BookInProgress`, `Booked`, `Paid`, …)

### Inputs

| Input | Type | Description |
|---|---|---|
| `days` | `PlannedDayResponse[]` | The planned days to display (columns) |
| `slotIndices` | `number[]` | Zero-based row indices to render |
| `slotDurationMinutes` | `number` | Duration of each slot in minutes (default 105) |
| `weekNumber` | `number` | ISO week number used to match booked time slots |
| `classMap` | `ScheduleTableClassMap` | CSS class overrides for each part of the table |

---

## The Problem Before the Optimisation

The template iterates every `(slotIndex, day)` pair using two nested `@for` loops:

```html
@for (slotIndex of slotIndices; track slotIndex) {
  @for (day of days; track day.id) {
    <!-- calls getTimeSlotForIndex(day, slotIndex) for every cell -->
  }
}
```

The original `getTimeSlotForIndex` delegated directly to `getTimeSlotUIData`:

```typescript
// Before
getTimeSlotForIndex(plannedDay: PlannedDayResponse, slotIndex: number): TimeSlotUI | null {
  const slots = this.getTimeSlotUIData(plannedDay); // full rebuild every call
  return slots[slotIndex] || null;
}
```

`getTimeSlotUIData` iterates all slots for the day, formats times, and filters the booked
time slots from the server response — from scratch on every call.

With 7 days and 8 slot rows that is **56 full rebuilds per change-detection cycle**, and
Angular's `OnPush` strategy only reduces how often change detection runs, not how many times
the template calls a method within a single cycle.

---

## The Optimisation

### Key Concepts Used

#### `Map<K, V>` (JavaScript built-in)
A `Map` is an associative collection that stores key-value pairs.
Looking up a value by key is O(1) regardless of how many entries are stored.

```typescript
const m = new Map<string, number>();
m.set('a', 1);
console.log(m.get('a')); // 1 — constant time
```

#### `ngOnChanges` (Angular lifecycle hook)
Angular calls `ngOnChanges` automatically, **before** the template is rendered,
every time one or more `@Input()` bindings receive a new value from the parent.
The `changes` parameter is a map that tells you which inputs changed.

```typescript
ngOnChanges(changes: SimpleChanges): void {
  // called once per change-detection cycle where an @Input changed
}
```

#### Optional chaining `?.` and nullish coalescing `??`
Two TypeScript/JavaScript operators for safe, concise null handling:

```typescript
obj?.property       // undefined if obj is null/undefined, otherwise obj.property
value ?? fallback   // fallback only when value is null or undefined
```

---

### Implementation

#### 1. Cache field

```typescript
private slotCache = new Map<string, TimeSlotUI[]>();
```

A private `Map` keyed by `PlannedDayResponse.id` (a unique string GUID).
Each value is the pre-built array of `TimeSlotUI` objects for that day.

#### 2. `ngOnChanges` — trigger cache rebuild

```typescript
ngOnChanges(changes: SimpleChanges): void {
  if (changes['days'] || changes['weekNumber'] || changes['slotDurationMinutes']) {
    this.rebuildSlotCache();
  }
}
```

Only the three inputs that affect slot data trigger a rebuild:
- `days` — the set of planned days changed (different site or navigation)
- `weekNumber` — the user switched to a different week (booking state changes)
- `slotDurationMinutes` — slot duration changed (start/end times change)

Changing `classMap` or `slotIndices` does not affect slot data, so no rebuild is needed.

#### 3. `rebuildSlotCache` — build once

```typescript
private rebuildSlotCache(): void {
  this.slotCache.clear();
  for (const day of this.days ?? []) {
    this.slotCache.set(day.id, this.getTimeSlotUIData(day));
  }
}
```

Iterates `this.days` exactly once (O(N days)).
`getTimeSlotUIData` is called once per day and the result is stored in the map.

#### 4. `getTimeSlotForIndex` — O(1) lookup

```typescript
getTimeSlotForIndex(plannedDay: PlannedDayResponse, slotIndex: number): TimeSlotUI | null {
  return this.slotCache.get(plannedDay.id)?.[slotIndex] ?? null;
}
```

- `slotCache.get(plannedDay.id)` — O(1) map lookup; returns the pre-built array or `undefined`
- `?.[slotIndex]` — safe array access (returns `undefined` if the array is undefined)
- `?? null` — converts `undefined` to `null` for a consistent return type

---

## Complexity Comparison

| | Calls to `getTimeSlotUIData` per cycle | Complexity |
|---|---|---|
| **Before** | `days.length × slotIndices.length` | O(N × M) |
| **After** | `days.length` (once, in `rebuildSlotCache`) | O(N) |

For a typical 7-day week with 8 time-slot rows this reduces rebuilds from **56 to 7** per cycle.
The template lookups themselves drop from O(N×M) full rebuilds to O(1) map + index access each.

---

## Related Files

- `schedule-table.component.ts` — component implementation
- `schedule-table.component.html` — template with the nested `@for` loops
- `timeslot-business-rules-quick-ref.md` — time slot booking rules and `BookState` lifecycle
