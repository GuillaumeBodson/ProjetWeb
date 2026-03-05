# Best Practices: Where to Declare Interfaces and Classes in Angular

## Overview
This guide explains when to declare interfaces/classes in components/services versus extracting them to separate files.

## The Rule of Thumb

### ✅ **Keep in Component/Service When:**
1. **Private Implementation Detail** - Only used internally by that single component/service
2. **Tightly Coupled** - The interface represents implementation details specific to that component
3. **Small and Simple** - Very small interfaces (1-3 properties)
4. **No Reusability** - Will never be used elsewhere

### ⚠️ **Extract to Separate Models File When:**
1. **Shared Across Multiple Files** - Used by 2+ components/services
2. **Domain Model** - Represents a business entity or concept
3. **Large or Complex** - More than 5-6 properties or complex nested structures
4. **Part of Public API** - Exported for use by consumers
5. **Testability** - Need to mock or stub in tests
6. **Future Reusability** - Might be reused even if not currently

## Real Example from Your Code

### Before Refactoring (Anti-Pattern)
```typescript
// ❌ BAD: Declared in service but used everywhere
// schedule.service.ts
export interface DaySchedule { ... }

// ❌ BAD: Declared in component but exported and used elsewhere
// schedule-table.component.ts
export interface ScheduleTableClassMap { ... }

// ✅ GOOD: Private to component, not exported
// schedule-table.component.ts
interface TimeSlotUI { ... }  // Only used internally
```

### After Refactoring (Best Practice)
```typescript
// ✅ EXCELLENT: Centralized models file
// models/schedule.models.ts
export interface DaySchedule { ... }          // Shared across feature
export interface TimeSlotUI { ... }           // Shared between components
export interface ScheduleTableClassMap { ... } // Shared, part of API
export const DEFAULT_SCHEDULE_TABLE_CLASS_MAP = { ... }

// ✅ GOOD: Service imports from models
// schedule.service.ts
import { DaySchedule } from '../models/schedule.models';

// ✅ GOOD: Components import from models
// schedule.component.ts
import { DaySchedule } from './models/schedule.models';
```

## File Organization Best Practices

### Recommended Structure for Angular Features
```
feature-name/
├── models/
│   └── feature.models.ts        # Shared interfaces/types
├── services/
│   └── feature.service.ts       # Business logic
├── components/
│   ├── component-a/
│   │   ├── component-a.ts
│   │   ├── component-a.html
│   │   └── component-a.css
│   └── component-b/
│       └── ...
└── feature.routes.ts
```

### Your Schedule Feature (After Refactoring)
```
schedule/
├── models/
│   └── schedule.models.ts       # ✅ All shared interfaces here
├── services/
│   └── schedule.service.ts      # ✅ Imports from models
├── components/
│   ├── weekly-planner/
│   │   └── weekly-planner.component.ts  # ✅ Imports from models
│   └── schedule-table/
│       └── schedule-table.component.ts  # ✅ Imports from models
└── schedule.component.ts        # ✅ Imports from models
```

## Detailed Examples

### Example 1: Component-Specific Interface (Keep It)
```typescript
// component.ts
@Component({ ... })
export class MyComponent {
  // ✅ GOOD: Private interface only used in this component
  private interface LocalState {
    isExpanded: boolean;
    selectedIndex: number;
  }
  
  private state: LocalState = {
    isExpanded: false,
    selectedIndex: 0
  };
}
```

### Example 2: Shared Interface (Extract It)
```typescript
// ❌ BAD: Declared in component but used elsewhere
@Component({ ... })
export class ProductListComponent {
  export interface ProductFilter {
    category: string;
    priceRange: { min: number; max: number };
    inStock: boolean;
  }
}

// ✅ GOOD: Extract to models file
// models/product.models.ts
export interface ProductFilter {
  category: string;
  priceRange: { min: number; max: number };
  inStock: boolean;
}

// Both components import from models
import { ProductFilter } from '../models/product.models';
```

### Example 3: Service-Specific Type (Keep It Private)
```typescript
// service.ts
@Injectable({ providedIn: 'root' })
export class DataService {
  // ✅ GOOD: Private type only used internally
  private type CacheEntry = {
    data: any;
    timestamp: number;
  };
  
  private cache = new Map<string, CacheEntry>();
}
```

### Example 4: Service Output Contract (Extract It)
```typescript
// ❌ BAD: Service exports interface used by many components
@Injectable({ providedIn: 'root' })
export class UserService {
  export interface UserProfile {
    id: string;
    name: string;
    email: string;
    // ... 10 more properties
  }
  
  getProfile(): Observable<UserProfile> { ... }
}

// ✅ GOOD: Extract to models
// models/user.models.ts
export interface UserProfile {
  id: string;
  name: string;
  email: string;
  // ... 10 more properties
}

// service.ts
import { UserProfile } from '../models/user.models';
@Injectable({ providedIn: 'root' })
export class UserService {
  getProfile(): Observable<UserProfile> { ... }
}
```

## Benefits of Extracting to Models File

### 1. Single Source of Truth
```typescript
// ✅ One place to update
// models/schedule.models.ts
export interface DaySchedule {
  date: Date;
  dayName: string;
  slots: TimeSlotResponse[];
  // Add new property - only one place to update!
  numberOfSlots: number;
}
```

### 2. Better Testability
```typescript
// test.spec.ts
import { DaySchedule } from '../models/schedule.models';

describe('ScheduleComponent', () => {
  it('should handle empty schedule', () => {
    const emptySchedule: DaySchedule[] = [];
    // Easy to create mock data
  });
});
```

### 3. Clear Dependencies
```typescript
// You can see all dependencies at a glance
import { DaySchedule, TimeSlotUI, ScheduleTableClassMap } from '../models/schedule.models';
import { ScheduleService } from '../services/schedule.service';
```

### 4. Prevents Circular Dependencies
```typescript
// ❌ BAD: Circular dependency risk
// component-a.ts imports from component-b.ts
// component-b.ts imports from component-a.ts

// ✅ GOOD: Both import from models
// component-a.ts imports from models
// component-b.ts imports from models
```

### 5. Better IDE Support
```typescript
// models/schedule.models.ts is easy to find
// IDE autocomplete works better
// Documentation in one place
```

## Common Scenarios

### Scenario 1: Form Interfaces
```typescript
// ✅ GOOD: Extract form models
// models/forms.models.ts
export interface LoginForm {
  email: string;
  password: string;
}

export interface RegistrationForm extends LoginForm {
  confirmPassword: string;
  acceptTerms: boolean;
}
```

### Scenario 2: API Response Types
```typescript
// ✅ GOOD: Extract API response models
// models/api.models.ts
export interface ApiResponse<T> {
  data: T;
  status: number;
  message: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  total: number;
  page: number;
  pageSize: number;
}
```

### Scenario 3: Component Configuration
```typescript
// ✅ GOOD: Extract configuration interfaces
// models/config.models.ts
export interface TableConfig {
  sortable: boolean;
  filterable: boolean;
  pageable: boolean;
  pageSize: number;
}

// Used by multiple table components
```

### Scenario 4: Enums and Constants
```typescript
// ✅ GOOD: Extract enums and constants
// models/constants.ts
export enum UserRole {
  Admin = 'ADMIN',
  User = 'USER',
  Guest = 'GUEST'
}

export const DEFAULT_PAGE_SIZE = 10;
export const MAX_UPLOAD_SIZE = 5 * 1024 * 1024; // 5MB
```

## When NOT to Extract

### Keep It Simple for Small Things
```typescript
// ✅ OK: Very simple, component-specific
@Component({ ... })
export class ToggleComponent {
  @Input() config: { label: string; enabled: boolean } = {
    label: 'Toggle',
    enabled: true
  };
}
```

### Private Implementation Details
```typescript
// ✅ OK: Internal implementation detail
@Component({ ... })
export class ChartComponent {
  private type ChartPoint = [number, number];
  
  private calculatePoints(): ChartPoint[] {
    // ...
  }
}
```

## Your Schedule Feature Analysis

| Interface | Was In | Should Be In | Reason |
|-----------|---------|--------------|---------|
| `DaySchedule` | Service | ✅ Models | Shared across 4+ files |
| `TimeSlotUI` | Component | ✅ Models | Used by table rendering logic |
| `ScheduleTableClassMap` | Component | ✅ Models | Exported and used by parent |
| `DEFAULT_SCHEDULE_TABLE_CLASS_MAP` | Component | ✅ Models | Constant shared across components |

## Summary

### Extract When:
- ✅ Shared between 2+ files
- ✅ Part of public API
- ✅ Domain/business model
- ✅ Large/complex (5+ properties)
- ✅ Used in tests

### Keep When:
- ✅ Private implementation detail
- ✅ Tightly coupled to single component
- ✅ Very simple (1-3 properties)
- ✅ Local type alias

### Your Refactored Code
**Before:** Interfaces scattered across components and services
**After:** All shared interfaces in `models/schedule.models.ts`

**Result:** 
- ✅ Better organization
- ✅ Single source of truth
- ✅ Easier to test
- ✅ Clearer dependencies
- ✅ No circular dependency risk
- ✅ Better IDE support

This follows Angular's style guide and enterprise best practices!

