import {Injectable} from '@angular/core';
import {
  BehaviorSubject,
  catchError,
  combineLatest,
  distinctUntilChanged,
  merge,
  Observable,
  of,
  shareReplay,
  Subject,
  switchMap
} from 'rxjs';
import {SiteDto} from '../types/site';
import {PageRequest, PageResponse} from '../../../shared/types/paging';
import {Comparison, FilterGroup} from '../../../shared/types/filter';


@Injectable({
  providedIn: 'root'
})
export class SiteService {


  private readonly requestSubject = new BehaviorSubject<PageRequest>({ pageIndex: 0, pageSize: 10 });
  readonly request$ = this.requestSubject.asObservable();

  private readonly filterSubject = new BehaviorSubject<FilterGroup | null>(null);
  readonly filter$ = this.filterSubject.asObservable().pipe(
    distinctUntilChanged((a, b) => JSON.stringify(a) === JSON.stringify(b))
  );

  private readonly refreshTrigger$ = new Subject<void>();

  /**
   * Emits a new page response whenever the request/filter changes or a refresh is triggered.
   */
  readonly page$: Observable<PageResponse<SiteDto>> = merge(
    combineLatest([
      this.request$.pipe(
        distinctUntilChanged((a, b) => a.pageIndex === b.pageIndex && a.pageSize === b.pageSize)
      ),
      this.filter$
    ]),
    // When refresh is triggered, re-emit current (request, filter)
    this.refreshTrigger$.pipe(switchMap(() => combineLatest([this.request$, this.filter$])))
  ).pipe(
    switchMap(([req, filter]) =>
      this.fetchPage(req, filter).pipe(
        catchError((err) => {
          console.error('Failed to fetch sites page', { request: req, filter, error: err });
          return of({
            items: [],
            pageIndex: req.pageIndex,
            pageSize: req.pageSize,
            totalItems: 0
          } satisfies PageResponse<SiteDto>);
        })
      )
    ),
    shareReplay({ bufferSize: 1, refCount: true })
  );

  onPageChange(req: PageRequest): void {
    this.requestSubject.next(req);
  }

  /**
   * Updates the current filter and resets to the first page.
   * Use `null` (clearFilter) when no filters are applied.
   */
  setFilter(filter: FilterGroup | null): void {
    this.filterSubject.next(filter);

    // Reset to first page when the filter changes.
    const current = this.requestSubject.value;
    this.requestSubject.next({ ...current, pageIndex: 0 });
  }

  clearFilter(): void {
    this.setFilter(null);
  }

  /** Re-fetches the current page (useful after create/update/delete). */
  refresh(): void {
    this.refreshTrigger$.next();
  }

  /**
   * Temporary in-memory data source.
   * Later: replace `fetchPage` with an HttpClient call to your backend.
   */
  private readonly sites: SiteDto[] = [
    {
      id: 1,
      name: 'Central Sports Center',
      openingHours: '08:00',
      closingHours: '22:00',
      closedDays: ['Sunday'],
      courts: [{ id: 1, number: 1 }, { id: 2, number: 2 }, { id: 3, number: 3 }],
      revenue: 128450,
      bookings: []
    },
    {
      id: 2,
      name: 'Riverside Club',
      openingHours: '07:30',
      closingHours: '21:30',
      closedDays: ['Monday'],
      courts: [{ id: 1, number: 1 }, { id: 2, number: 2 }],
      revenue: 84200,
      bookings: []
    },
    {
      id: 3,
      name: 'Northside Arena',
      openingHours: '09:00',
      closingHours: '20:00',
      closedDays: [],
      courts: [{ id: 1, number: 1 }, { id: 2, number: 2 }, { id: 3, number: 3 }],
      revenue: 61350,
      bookings: []
    },
    {
      id: 4,
      name: 'East Park Courts',
      openingHours: '10:00',
      closingHours: '19:00',
      closedDays: ['Saturday'],
      courts: [{ id: 1, number: 1 }, { id: 2, number: 2 }, { id: 3, number: 3 }, { id: 4, number: 4 }],
      revenue: 45500,
      bookings: []
    },
    {
      id: 5,
      name: 'West End Sports Hall',
      openingHours: '06:00',
      closingHours: '23:00',
      closedDays: [],
      courts: [{ id: 1, number: 1 }, { id: 2, number: 2 }],
      revenue: 173900,
      bookings: []
    },
    {
      id: 6,
      name: 'Lakeside Tennis',
      openingHours: '08:30',
      closingHours: '21:00',
      closedDays: ['Tuesday'],
      courts: [{ id: 1, number: 1 }, { id: 2, number: 2 }, { id: 3, number: 3 }],
      revenue: 98750,
      bookings: []
    },
    {
      id: 7,
      name: 'City Gym Courts',
      openingHours: '07:00',
      closingHours: '22:30',
      closedDays: [],
      courts: [{ id: 1, number: 1 }],
      revenue: 52100,
      bookings: []
    },
    {
      id: 8,
      name: 'Hilltop Courts',
      openingHours: '09:30',
      closingHours: '18:30',
      closedDays: ['Sunday'],
      courts: [{ id: 1, number: 1 }, { id: 2, number: 2 }],
      revenue: 33700,
      bookings: []
    },
    {
      id: 9,
      name: 'University Sports Complex',
      openingHours: '08:00',
      closingHours: '20:30',
      closedDays: ['Sunday'],
      courts: [{ id: 1, number: 1 }, { id: 2, number: 2 }, { id: 3, number: 3 }, { id: 4, number: 4 }],
      revenue: 110500,
      bookings: []
    },
    {
      id: 10,
      name: 'Community Courts',
      openingHours: '11:00',
      closingHours: '17:00',
      closedDays: ['Wednesday'],
      courts: [{ id: 1, number: 1 }, { id: 2, number: 2 }],
      revenue: 21400,
      bookings: []
    },
    {
      id: 11,
      name: 'Forest Sports Grounds',
      openingHours: '08:00',
      closingHours: '19:30',
      closedDays: [],
      courts: [{ id: 1, number: 1 }, { id: 2, number: 2 }, { id: 3, number: 3 }],
      revenue: 58700,
      bookings: []
    },
    {
      id: 12,
      name: 'Downtown Courts',
      openingHours: '07:00',
      closingHours: '21:00',
      closedDays: ['Monday'],
      courts: [{ id: 1, number: 1 }, { id: 2, number: 2 }],
      revenue: 76500,
      bookings: []
    },
    {
      id: 13,
      name: 'Harbor Sports Club',
      openingHours: '08:00',
      closingHours: '20:00',
      closedDays: ['Sunday'],
      courts: [{ id: 1, number: 1 }],
      revenue: 40900,
      bookings: []
    },
    {
      id: 14,
      name: 'Meadow Courts',
      openingHours: '09:00',
      closingHours: '18:00',
      closedDays: ['Thursday'],
      courts: [{ id: 1, number: 1 }, { id: 2, number: 2 }, { id: 3, number: 3 }],
      revenue: 37250,
      bookings: []
    },
    {
      id: 15,
      name: 'Grand Arena',
      openingHours: '06:30',
      closingHours: '23:00',
      closedDays: [],
      courts: [{ id: 1, number: 1 }, { id: 2, number: 2 }, { id: 3, number: 3 }, { id: 4, number: 4 }, { id: 5, number: 5 }],
      revenue: 225000,
      bookings: []
    }
  ];
  /**
   * Replace with real HttpClient call in a service.
   * Current version pages/filters the in-memory `sites` array.
   */
  private fetchPage(req: PageRequest, filter: FilterGroup | null): Observable<PageResponse<SiteDto>> {
    const filtered = this.applyFilter(this.sites, filter);

    const start = req.pageIndex * req.pageSize;
    const items = filtered.slice(start, start + req.pageSize);

    return of({
      items,
      pageIndex: req.pageIndex,
      pageSize: req.pageSize,
      totalItems: filtered.length
    });
  }

  private applyFilter(sites: SiteDto[], filter: FilterGroup | null): SiteDto[] {
    if (!filter || !filter.filters?.length) {
      return sites;
    }

    // Very small demo implementation for the current in-memory dataset.
    // When you connect to your backend, you can remove this and send `filter` as part of the request.
    return filter.filters.reduce((acc, f) => {
      const prop = (f.propertyName ?? '').toLowerCase();
      const value = f.valueString ?? '';

      if (!value) {
        return acc;
      }

      switch (prop) {
        case 'name': {
          if (f.comparison === Comparison.CONTAINS) {
            const needle = value.toLowerCase();
            return acc.filter(s => (s.name ?? '').toLowerCase().includes(needle));
          }
          if (f.comparison === Comparison.EQUALS) {
            return acc.filter(s => (s.name ?? '') === value);
          }
          return acc;
        }
        case 'revenue': {
          const n = Number(value);
          if (Number.isNaN(n)) {
            return acc;
          }
          if (f.comparison === Comparison.GREATER_THAN) {
            return acc.filter(s => s.revenue > n);
          }
          if (f.comparison === Comparison.LESS_THAN) {
            return acc.filter(s => s.revenue < n);
          }
          if (f.comparison === Comparison.EQUALS) {
            return acc.filter(s => s.revenue === n);
          }
          return acc;
        }
        default:
          return acc;
      }
    }, sites);
  }

  /** Returns a single site by id from the in-memory dataset. */
  getById(id: number): Observable<SiteDto | null> {
    return of(this.sites.find(s => s.id === id) ?? null);
  }

  /** Updates a site in the in-memory dataset and triggers a refresh for list subscribers. */
  update(site: SiteDto): Observable<SiteDto> {
    const idx = this.sites.findIndex(s => s.id === site.id);

    if (idx >= 0) {
      this.sites[idx] = { ...site };
    } else {
      this.sites.unshift({ ...site });
    }

    this.refresh();
    return of(this.sites[idx >= 0 ? idx : 0]);
  }
}
