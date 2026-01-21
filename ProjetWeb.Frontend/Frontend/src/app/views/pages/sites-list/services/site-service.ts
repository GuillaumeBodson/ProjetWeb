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
      courts: ['Court A', 'Court B', 'Court C'],
      revenue: 128450
    },
    {
      id: 2,
      name: 'Riverside Club',
      openingHours: '07:30',
      closingHours: '21:30',
      closedDays: ['Monday'],
      courts: ['Court 1', 'Court 2'],
      revenue: 84200
    },
    {
      id: 3,
      name: 'Northside Arena',
      openingHours: '09:00',
      closingHours: '20:00',
      closedDays: [],
      courts: ['Indoor 1', 'Indoor 2', 'Outdoor 1'],
      revenue: 61350
    },
    {
      id: 4,
      name: 'East Park Courts',
      openingHours: '10:00',
      closingHours: '19:00',
      closedDays: ['Saturday'],
      courts: ['Clay 1', 'Clay 2', 'Clay 3', 'Clay 4'],
      revenue: 45500
    },
    {
      id: 5,
      name: 'West End Sports Hall',
      openingHours: '06:00',
      closingHours: '23:00',
      closedDays: [],
      courts: ['Hall A', 'Hall B'],
      revenue: 173900
    },
    {
      id: 6,
      name: 'Lakeside Tennis',
      openingHours: '08:30',
      closingHours: '21:00',
      closedDays: ['Tuesday'],
      courts: ['Lake 1', 'Lake 2', 'Lake 3'],
      revenue: 98750
    },
    {
      id: 7,
      name: 'City Gym Courts',
      openingHours: '07:00',
      closingHours: '22:30',
      closedDays: [],
      courts: ['Gym 1'],
      revenue: 52100
    },
    {
      id: 8,
      name: 'Hilltop Courts',
      openingHours: '09:30',
      closingHours: '18:30',
      closedDays: ['Sunday'],
      courts: ['Hill 1', 'Hill 2'],
      revenue: 33700
    },
    {
      id: 9,
      name: 'University Sports Complex',
      openingHours: '08:00',
      closingHours: '20:30',
      closedDays: ['Sunday'],
      courts: ['Uni A', 'Uni B', 'Uni C', 'Uni D'],
      revenue: 110500
    },
    {
      id: 10,
      name: 'Community Courts',
      openingHours: '11:00',
      closingHours: '17:00',
      closedDays: ['Wednesday'],
      courts: ['Community 1', 'Community 2'],
      revenue: 21400
    },
    {
      id: 11,
      name: 'Forest Sports Grounds',
      openingHours: '08:00',
      closingHours: '19:30',
      closedDays: [],
      courts: ['Forest 1', 'Forest 2', 'Forest 3'],
      revenue: 58700
    },
    {
      id: 12,
      name: 'Downtown Courts',
      openingHours: '07:00',
      closingHours: '21:00',
      closedDays: ['Monday'],
      courts: ['DT 1', 'DT 2'],
      revenue: 76500
    },
    {
      id: 13,
      name: 'Harbor Sports Club',
      openingHours: '08:00',
      closingHours: '20:00',
      closedDays: ['Sunday'],
      courts: ['Harbor 1'],
      revenue: 40900
    },
    {
      id: 14,
      name: 'Meadow Courts',
      openingHours: '09:00',
      closingHours: '18:00',
      closedDays: ['Thursday'],
      courts: ['Meadow 1', 'Meadow 2', 'Meadow 3'],
      revenue: 37250
    },
    {
      id: 15,
      name: 'Grand Arena',
      openingHours: '06:30',
      closingHours: '23:00',
      closedDays: [],
      courts: ['Main 1', 'Main 2', 'Main 3', 'Main 4', 'Main 5'],
      revenue: 225000
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
    if (!filter || !filter.Filters?.length) {
      return sites;
    }

    // Very small demo implementation for the current in-memory dataset.
    // When you connect to your backend, you can remove this and send `filter` as part of the request.
    return filter.Filters.reduce((acc, f) => {
      const prop = (f.PropertyName ?? '').toLowerCase();
      const value = f.ValueString ?? '';

      if (!value) {
        return acc;
      }

      switch (prop) {
        case 'name': {
          if (f.Comparison === Comparison.CONTAINS) {
            const needle = value.toLowerCase();
            return acc.filter(s => (s.name ?? '').toLowerCase().includes(needle));
          }
          if (f.Comparison === Comparison.EQUALS) {
            return acc.filter(s => (s.name ?? '') === value);
          }
          return acc;
        }
        case 'revenue': {
          const n = Number(value);
          if (Number.isNaN(n)) {
            return acc;
          }
          if (f.Comparison === Comparison.GREATER_THAN) {
            return acc.filter(s => s.revenue > n);
          }
          if (f.Comparison === Comparison.LESS_THAN) {
            return acc.filter(s => s.revenue < n);
          }
          if (f.Comparison === Comparison.EQUALS) {
            return acc.filter(s => s.revenue === n);
          }
          return acc;
        }
        default:
          return acc;
      }
    }, sites);
  }
}
