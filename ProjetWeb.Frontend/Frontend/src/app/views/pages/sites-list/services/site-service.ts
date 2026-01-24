// Frontend/src/app/views/pages/sites-list/services/site-service.ts
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

  private static weekdayToDate(weekday: string, base: Date = new Date()): Date {
    const map: Record<string, number> = {
      sunday: 0,
      monday: 1,
      tuesday: 2,
      wednesday: 3,
      thursday: 4,
      friday: 5,
      saturday: 6
    };

    const target = map[weekday.trim().toLowerCase()];
    if (target === undefined) {
      throw new Error(`Invalid weekday: ${weekday}`);
    }

    const d = new Date(base);
    d.setHours(0, 0, 0, 0);

    const current = d.getDay();
    const delta = (target - current + 7) % 7;
    d.setDate(d.getDate() + delta);
    return d;
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
      closedDays: [SiteService.weekdayToDate('Sunday')],
      courts: [{ id: 1, number: 1 }, { id: 2, number: 2 }, { id: 3, number: 3 }],
      revenue: 128450,
      bookings: [
        { id: 1, courtId: 1, siteId: 1, startTime: new Date('2026-01-25T09:00:00'), endTime: new Date('2026-01-25T10:30:00') },
        { id: 2, courtId: 1, siteId: 1, startTime: new Date('2026-01-25T14:00:00'), endTime: new Date('2026-01-25T16:00:00') },
        { id: 3, courtId: 2, siteId: 1, startTime: new Date('2026-01-25T10:00:00'), endTime: new Date('2026-01-25T11:30:00') },
        { id: 4, courtId: 3, siteId: 1, startTime: new Date('2026-01-26T08:00:00'), endTime: new Date('2026-01-26T09:00:00') },
        { id: 5, courtId: 1, siteId: 1, startTime: new Date('2026-01-27T18:00:00'), endTime: new Date('2026-01-27T20:00:00') }
      ]
    },
    {
      id: 2,
      name: 'Riverside Club',
      openingHours: '07:30',
      closingHours: '21:30',
      closedDays: [SiteService.weekdayToDate('Monday')],
      courts: [{ id: 1, number: 1 }, { id: 2, number: 2 }],
      revenue: 84200,
      bookings: [
        { id: 6, courtId: 1, siteId: 2, startTime: new Date('2026-01-25T08:00:00'), endTime: new Date('2026-01-25T09:30:00') },
        { id: 7, courtId: 2, siteId: 2, startTime: new Date('2026-01-25T15:00:00'), endTime: new Date('2026-01-25T17:00:00') },
        { id: 8, courtId: 1, siteId: 2, startTime: new Date('2026-01-28T19:00:00'), endTime: new Date('2026-01-28T21:00:00') }
      ]
    },
    {
      id: 3,
      name: 'Northside Arena',
      openingHours: '09:00',
      closingHours: '20:00',
      closedDays: [],
      courts: [{ id: 1, number: 1 }, { id: 2, number: 2 }, { id: 3, number: 3 }],
      revenue: 61350,
      bookings: [
        { id: 9, courtId: 1, siteId: 3, startTime: new Date('2026-01-24T10:00:00'), endTime: new Date('2026-01-24T12:00:00') },
        { id: 10, courtId: 2, siteId: 3, startTime: new Date('2026-01-24T13:00:00'), endTime: new Date('2026-01-24T14:30:00') },
        { id: 11, courtId: 3, siteId: 3, startTime: new Date('2026-01-25T11:00:00'), endTime: new Date('2026-01-25T12:00:00') }
      ]
    },
    {
      id: 4,
      name: 'East Park Courts',
      openingHours: '10:00',
      closingHours: '19:00',
      closedDays: [SiteService.weekdayToDate('Saturday')],
      courts: [{ id: 1, number: 1 }, { id: 2, number: 2 }, { id: 3, number: 3 }, { id: 4, number: 4 }],
      revenue: 45500,
      bookings: [
        { id: 12, courtId: 1, siteId: 4, startTime: new Date('2026-01-27T11:00:00'), endTime: new Date('2026-01-27T12:30:00') },
        { id: 13, courtId: 2, siteId: 4, startTime: new Date('2026-01-27T14:00:00'), endTime: new Date('2026-01-27T15:00:00') },
        { id: 14, courtId: 3, siteId: 4, startTime: new Date('2026-01-28T10:30:00'), endTime: new Date('2026-01-28T12:00:00') },
        { id: 15, courtId: 4, siteId: 4, startTime: new Date('2026-01-29T16:00:00'), endTime: new Date('2026-01-29T18:00:00') }
      ]
    },
    {
      id: 5,
      name: 'West End Sports Hall',
      openingHours: '06:00',
      closingHours: '23:00',
      closedDays: [],
      courts: [{ id: 1, number: 1 }, { id: 2, number: 2 }],
      revenue: 173900,
      bookings: [
        { id: 16, courtId: 1, siteId: 5, startTime: new Date('2026-01-24T06:30:00'), endTime: new Date('2026-01-24T08:00:00') },
        { id: 17, courtId: 1, siteId: 5, startTime: new Date('2026-01-24T20:00:00'), endTime: new Date('2026-01-24T22:00:00') },
        { id: 18, courtId: 2, siteId: 5, startTime: new Date('2026-01-25T07:00:00'), endTime: new Date('2026-01-25T08:30:00') },
        { id: 19, courtId: 2, siteId: 5, startTime: new Date('2026-01-25T19:00:00'), endTime: new Date('2026-01-25T21:00:00') }
      ]
    },
    {
      id: 6,
      name: 'Lakeside Tennis',
      openingHours: '08:30',
      closingHours: '21:00',
      closedDays: [SiteService.weekdayToDate('Tuesday')],
      courts: [{ id: 1, number: 1 }, { id: 2, number: 2 }, { id: 3, number: 3 }],
      revenue: 98750,
      bookings: [
        { id: 20, courtId: 1, siteId: 6, startTime: new Date('2026-01-26T09:00:00'), endTime: new Date('2026-01-26T10:30:00') },
        { id: 21, courtId: 2, siteId: 6, startTime: new Date('2026-01-26T15:00:00'), endTime: new Date('2026-01-26T16:30:00') },
        { id: 22, courtId: 3, siteId: 6, startTime: new Date('2026-01-28T17:00:00'), endTime: new Date('2026-01-28T18:30:00') }
      ]
    },
    {
      id: 7,
      name: 'City Gym Courts',
      openingHours: '07:00',
      closingHours: '22:30',
      closedDays: [],
      courts: [{ id: 1, number: 1 }],
      revenue: 52100,
      bookings: [
        { id: 23, courtId: 1, siteId: 7, startTime: new Date('2026-01-24T07:30:00'), endTime: new Date('2026-01-24T09:00:00') },
        { id: 24, courtId: 1, siteId: 7, startTime: new Date('2026-01-24T18:00:00'), endTime: new Date('2026-01-24T19:30:00') },
        { id: 25, courtId: 1, siteId: 7, startTime: new Date('2026-01-25T12:00:00'), endTime: new Date('2026-01-25T13:30:00') }
      ]
    },
    {
      id: 8,
      name: 'Hilltop Courts',
      openingHours: '09:30',
      closingHours: '18:30',
      closedDays: [SiteService.weekdayToDate('Sunday')],
      courts: [{ id: 1, number: 1 }, { id: 2, number: 2 }],
      revenue: 33700,
      bookings: [
        { id: 26, courtId: 1, siteId: 8, startTime: new Date('2026-01-27T10:00:00'), endTime: new Date('2026-01-27T11:30:00') },
        { id: 27, courtId: 2, siteId: 8, startTime: new Date('2026-01-28T14:00:00'), endTime: new Date('2026-01-28T15:30:00') }
      ]
    },
    {
      id: 9,
      name: 'University Sports Complex',
      openingHours: '08:00',
      closingHours: '20:30',
      closedDays: [SiteService.weekdayToDate('Sunday')],
      courts: [{ id: 1, number: 1 }, { id: 2, number: 2 }, { id: 3, number: 3 }, { id: 4, number: 4 }],
      revenue: 110500,
      bookings: [
        { id: 28, courtId: 1, siteId: 9, startTime: new Date('2026-01-24T08:30:00'), endTime: new Date('2026-01-24T10:00:00') },
        { id: 29, courtId: 2, siteId: 9, startTime: new Date('2026-01-24T11:00:00'), endTime: new Date('2026-01-24T12:30:00') },
        { id: 30, courtId: 3, siteId: 9, startTime: new Date('2026-01-25T16:00:00'), endTime: new Date('2026-01-25T17:30:00') },
        { id: 31, courtId: 4, siteId: 9, startTime: new Date('2026-01-26T09:00:00'), endTime: new Date('2026-01-26T10:30:00') }
      ]
    },
    {
      id: 10,
      name: 'Community Courts',
      openingHours: '11:00',
      closingHours: '17:00',
      closedDays: [SiteService.weekdayToDate('Wednesday')],
      courts: [{ id: 1, number: 1 }, { id: 2, number: 2 }],
      revenue: 21400,
      bookings: [
        { id: 32, courtId: 1, siteId: 10, startTime: new Date('2026-01-24T12:00:00'), endTime: new Date('2026-01-24T13:30:00') },
        { id: 33, courtId: 2, siteId: 10, startTime: new Date('2026-01-27T14:00:00'), endTime: new Date('2026-01-27T15:30:00') }
      ]
    },
    {
      id: 11,
      name: 'Forest Sports Grounds',
      openingHours: '08:00',
      closingHours: '19:30',
      closedDays: [],
      courts: [{ id: 1, number: 1 }, { id: 2, number: 2 }, { id: 3, number: 3 }],
      revenue: 58700,
      bookings: [
        { id: 34, courtId: 1, siteId: 11, startTime: new Date('2026-01-24T09:00:00'), endTime: new Date('2026-01-24T10:30:00') },
        { id: 35, courtId: 2, siteId: 11, startTime: new Date('2026-01-25T13:00:00'), endTime: new Date('2026-01-25T14:30:00') },
        { id: 36, courtId: 3, siteId: 11, startTime: new Date('2026-01-26T16:00:00'), endTime: new Date('2026-01-26T17:30:00') }
      ]
    },
    {
      id: 12,
      name: 'Downtown Courts',
      openingHours: '07:00',
      closingHours: '21:00',
      closedDays: [SiteService.weekdayToDate('Monday')],
      courts: [{ id: 1, number: 1 }, { id: 2, number: 2 }],
      revenue: 76500,
      bookings: [
        { id: 37, courtId: 1, siteId: 12, startTime: new Date('2026-01-24T08:00:00'), endTime: new Date('2026-01-24T09:30:00') },
        { id: 38, courtId: 2, siteId: 12, startTime: new Date('2026-01-25T17:00:00'), endTime: new Date('2026-01-25T18:30:00') },
        { id: 39, courtId: 1, siteId: 12, startTime: new Date('2026-01-27T19:00:00'), endTime: new Date('2026-01-27T20:30:00') }
      ]
    },
    {
      id: 13,
      name: 'Harbor Sports Club',
      openingHours: '08:00',
      closingHours: '20:00',
      closedDays: [SiteService.weekdayToDate('Sunday')],
      courts: [{ id: 1, number: 1 }],
      revenue: 40900,
      bookings: [
        { id: 40, courtId: 1, siteId: 13, startTime: new Date('2026-01-24T10:00:00'), endTime: new Date('2026-01-24T11:30:00') },
        { id: 41, courtId: 1, siteId: 13, startTime: new Date('2026-01-28T15:00:00'), endTime: new Date('2026-01-28T16:30:00') }
      ]
    },
    {
      id: 14,
      name: 'Meadow Courts',
      openingHours: '09:00',
      closingHours: '18:00',
      closedDays: [SiteService.weekdayToDate('Thursday')],
      courts: [{ id: 1, number: 1 }, { id: 2, number: 2 }, { id: 3, number: 3 }],
      revenue: 37250,
      bookings: [
        { id: 42, courtId: 1, siteId: 14, startTime: new Date('2026-01-24T10:00:00'), endTime: new Date('2026-01-24T11:30:00') },
        { id: 43, courtId: 2, siteId: 14, startTime: new Date('2026-01-25T13:00:00'), endTime: new Date('2026-01-25T14:30:00') },
        { id: 44, courtId: 3, siteId: 14, startTime: new Date('2026-01-27T15:00:00'), endTime: new Date('2026-01-27T16:30:00') }
      ]
    },
    {
      id: 15,
      name: 'Grand Arena',
      openingHours: '06:30',
      closingHours: '23:00',
      closedDays: [],
      courts: [{ id: 1, number: 1 }, { id: 2, number: 2 }, { id: 3, number: 3 }, { id: 4, number: 4 }, { id: 5, number: 5 }],
      revenue: 225000,
      bookings: [
        { id: 45, courtId: 1, siteId: 15, startTime: new Date('2026-01-24T07:00:00'), endTime: new Date('2026-01-24T09:00:00') },
        { id: 46, courtId: 2, siteId: 15, startTime: new Date('2026-01-24T10:00:00'), endTime: new Date('2026-01-24T12:00:00') },
        { id: 47, courtId: 3, siteId: 15, startTime: new Date('2026-01-25T14:00:00'), endTime: new Date('2026-01-25T16:00:00') },
        { id: 48, courtId: 4, siteId: 15, startTime: new Date('2026-01-26T18:00:00'), endTime: new Date('2026-01-26T20:00:00') },
        { id: 49, courtId: 5, siteId: 15, startTime: new Date('2026-01-27T20:00:00'), endTime: new Date('2026-01-27T22:00:00') }
      ]
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
