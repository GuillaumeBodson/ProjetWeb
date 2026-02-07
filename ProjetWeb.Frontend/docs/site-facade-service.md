# Site Facade Service

## Overview

The `SiteFacadeService` is a facade service that wraps the auto-generated `SitesService` API client. It provides a cleaner, more focused API for site-related operations while following SOLID principles and Angular best practices.

## Purpose

The facade pattern is used to:

1. **Simplify the API**: The auto-generated `SitesService` has complex method signatures with multiple overloads. The facade provides simpler, more intuitive methods.

2. **Centralize Error Handling**: All error handling logic is centralized in one place, making it easier to maintain and modify.

3. **Business Logic Separation**: The facade layer can contain business logic and state management, keeping the raw API calls separate from business concerns.

4. **Easier Testing**: Components can inject and mock the facade service instead of dealing with the complex auto-generated service.

5. **Future-Proofing**: If the API changes, you only need to update the facade, not every component that uses sites.

## Usage

### Basic Import

```typescript
import { inject } from '@angular/core';
import { SiteFacadeService } from '@core/services/site-facade.service';

export class MyComponent {
  private readonly siteFacade = inject(SiteFacadeService);
}
```

### Get All Sites

Fetch all sites without pagination:

```typescript
loadAllSites(): void {
  this.siteFacade.getAllSites().subscribe({
    next: (sites) => {
      console.log('All sites:', sites);
      this.sites.set(sites);
    },
    error: (error) => {
      console.error('Failed to load sites:', error);
    }
  });
}
```

### Get Paginated Sites

Fetch sites with pagination, filtering, and sorting:

```typescript
loadSitesPaginated(): void {
  const pageNumber = 1;
  const pageSize = 10;
  const filters = [
    {
      logic: 'and',
      filters: [
        {
          field: 'city',
          operator: 'eq',
          value: 'Brussels'
        }
      ]
    }
  ];
  const sorts = [
    {
      field: 'name',
      direction: 'asc'
    }
  ];

  this.siteFacade.getSitesPaginated(pageNumber, pageSize, filters, sorts).subscribe({
    next: (response) => {
      console.log('Paginated sites:', response.items);
      console.log('Total count:', response.totalCount);
      this.sites.set(response.items ?? []);
      this.totalCount.set(response.totalCount ?? 0);
    },
    error: (error) => {
      console.error('Failed to load paginated sites:', error);
    }
  });
}
```

### Get Single Site by ID

Fetch a specific site by its UUID:

```typescript
loadSite(siteId: string): void {
  this.siteFacade.getSiteById(siteId).subscribe({
    next: (site) => {
      console.log('Site details:', site);
      this.currentSite.set(site);
    },
    error: (error) => {
      console.error('Failed to load site:', error);
    }
  });
}
```

### Create a New Site

Create a new site:

```typescript
createNewSite(): void {
  const newSite = {
    name: 'New Sports Center',
    address: '123 Main Street',
    city: 'Brussels',
    postalCode: '1000',
    country: 'Belgium',
    description: 'A modern sports facility',
    phoneNumber: '+32 2 123 45 67',
    email: 'info@sportscenter.be'
  };

  this.siteFacade.createSite(newSite).subscribe({
    next: (createdSite) => {
      console.log('Site created:', createdSite);
      this.router.navigate(['/sites', createdSite.id]);
    },
    error: (error) => {
      console.error('Failed to create site:', error);
    }
  });
}
```

### Update an Existing Site

Update a site's information:

```typescript
updateSite(siteId: string): void {
  const updateData = {
    name: 'Updated Sports Center',
    address: '456 New Avenue',
    city: 'Brussels',
    postalCode: '1000',
    country: 'Belgium',
    description: 'Updated description',
    phoneNumber: '+32 2 987 65 43',
    email: 'contact@sportscenter.be'
  };

  this.siteFacade.updateSite(siteId, updateData).subscribe({
    next: (updatedSite) => {
      console.log('Site updated:', updatedSite);
      this.currentSite.set(updatedSite);
    },
    error: (error) => {
      console.error('Failed to update site:', error);
    }
  });
}
```

### Delete a Site

Delete a site by its ID:

```typescript
deleteSite(siteId: string): void {
  if (confirm('Are you sure you want to delete this site?')) {
    this.siteFacade.deleteSite(siteId).subscribe({
      next: () => {
        console.log('Site deleted successfully');
        this.router.navigate(['/sites']);
      },
      error: (error) => {
        console.error('Failed to delete site:', error);
      }
    });
  }
}
```

### Book a Time Slot

Book a time slot at a specific site:

```typescript
bookSlot(
  siteId: string,
  plannedDayId: string,
  courtId: string,
  weekNumber: number,
  bookState: string
): void {
  const bookingRequest = {
    plannedDayId,
    courtId,
    weekNumber,
    bookState
  };

  this.siteFacade.bookTimeSlot(siteId, bookingRequest).subscribe({
    next: (timeSlot) => {
      console.log('Time slot booked:', timeSlot);
      this.showSuccessMessage('Booking confirmed!');
    },
    error: (error) => {
      console.error('Failed to book time slot:', error);
      this.showErrorMessage('Booking failed. Please try again.');
    }
  });
}
```

## Using with Signals (Angular 21)

The facade works perfectly with Angular 21's signal-based approach:

```typescript
import { Component, signal, inject } from '@angular/core';
import { SiteFacadeService } from '@core/services/site-facade.service';
import { SiteResponse } from '@core/api/site';

@Component({
  selector: 'app-sites-list',
  standalone: true,
  template: `
    @if (isLoading()) {
      <mat-spinner></mat-spinner>
    } @else {
      @for (site of sites(); track site.id) {
        <app-site-card [site]="site" (click)="selectSite(site)"></app-site-card>
      }
    }
  `
})
export class SitesListComponent {
  private readonly siteFacade = inject(SiteFacadeService);
  
  sites = signal<SiteResponse[]>([]);
  isLoading = signal(false);
  
  ngOnInit(): void {
    this.loadSites();
  }
  
  loadSites(): void {
    this.isLoading.set(true);
    
    this.siteFacade.getAllSites().subscribe({
      next: (sites) => {
        this.sites.set(sites);
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Failed to load sites:', error);
        this.isLoading.set(false);
      }
    });
  }
  
  selectSite(site: SiteResponse): void {
    console.log('Selected site:', site);
  }
}
```

## Error Handling

The facade automatically handles errors and logs them to the console. All methods return Observables that emit errors with descriptive messages:

```typescript
this.siteFacade.getSiteById('invalid-id').subscribe({
  next: (site) => {
    // Handle success
  },
  error: (error) => {
    // error.message will contain: "Failed to fetch site with ID: invalid-id"
    this.showNotification(error.message);
  }
});
```

## Comparison with AuthFacadeService

The `SiteFacadeService` follows the same pattern as `AuthFacadeService`:

| Feature | AuthFacadeService | SiteFacadeService |
|---------|------------------|-------------------|
| Wraps auto-generated service | ✅ AuthService | ✅ SitesService |
| Simplifies API calls | ✅ | ✅ |
| Centralized error handling | ✅ | ✅ |
| Returns Observables | ✅ | ✅ |
| Uses dependency injection | ✅ | ✅ |
| Provided at root level | ✅ | ✅ |

## Best Practices

1. **Always use the facade**: Components should inject `SiteFacadeService`, not `SitesService` directly.

2. **Handle errors gracefully**: Always provide error handlers in your subscriptions.

3. **Unsubscribe properly**: Use `takeUntilDestroyed()` or the `async` pipe to avoid memory leaks.

4. **Use signals for state**: Store the results in signals for reactive updates.

5. **Type safety**: The facade maintains full TypeScript type safety from the auto-generated models.

## Testing

The facade is easy to mock in unit tests:

```typescript
const mockSiteFacade = {
  getAllSites: () => of([mockSite1, mockSite2]),
  getSiteById: (id: string) => of(mockSite1),
  createSite: (data: CreateSiteRequest) => of(mockSite1),
  updateSite: (id: string, data: UpdateSiteRequest) => of(mockSite1),
  deleteSite: (id: string) => of(void 0),
  bookTimeSlot: (siteId: string, data: BookTimeSlotRequest) => of(mockTimeSlot)
};

TestBed.configureTestingModule({
  providers: [
    { provide: SiteFacadeService, useValue: mockSiteFacade }
  ]
});
```

## Related Files

- **Service Implementation**: `src/app/core/services/site-facade.service.ts`
- **API Models**: `src/app/core/api/site/model/`
- **Generated API Service**: `src/app/core/api/site/api/sites.service.ts`
