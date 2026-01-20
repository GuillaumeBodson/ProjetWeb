import { Injectable } from '@angular/core';
import {
  BehaviorSubject,
  catchError,
  distinctUntilChanged,
  merge,
  Observable,
  of,
  shareReplay,
  Subject,
  switchMap
} from 'rxjs';
import { SiteDto } from '../types/site';
import { PageRequest, PageResponse } from '../../../shared/types/paging';


@Injectable({
  providedIn: 'root'
})
export class SiteService {


  private readonly requestSubject = new BehaviorSubject<PageRequest>({ pageIndex: 0, pageSize: 10 });
  readonly request$ = this.requestSubject.asObservable();

  private readonly refreshTrigger$ = new Subject<void>();

  /**
   * Emits a new page response whenever the request changes or a refresh is triggered.
   */
  readonly page$: Observable<PageResponse<SiteDto>> = merge(
    this.request$.pipe(
      distinctUntilChanged((a, b) => a.pageIndex === b.pageIndex && a.pageSize === b.pageSize)
    ),
    // When refresh is triggered, re-emit current request
    this.refreshTrigger$.pipe(switchMap(() => this.request$))
  ).pipe(
    switchMap((req) =>
      this.fetchPage(req).pipe(
        catchError((err) => {
          console.error('Failed to fetch sites page', { request: req, error: err });
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
      courts: ['Court A', 'Court B', 'Court C']
    },
    {
      id: 2,
      name: 'Riverside Club',
      openingHours: '07:30',
      closingHours: '21:30',
      closedDays: ['Monday'],
      courts: ['Court 1', 'Court 2']
    },
    {
      id: 3,
      name: 'Northside Arena',
      openingHours: '09:00',
      closingHours: '20:00',
      closedDays: [],
      courts: ['Indoor 1', 'Indoor 2', 'Outdoor 1']
    },
    {
      id: 4,
      name: 'East Park Courts',
      openingHours: '10:00',
      closingHours: '19:00',
      closedDays: ['Saturday'],
      courts: ['Clay 1', 'Clay 2', 'Clay 3', 'Clay 4']
    },
    {
      id: 5,
      name: 'West End Sports Hall',
      openingHours: '06:00',
      closingHours: '23:00',
      closedDays: [],
      courts: ['Hall A', 'Hall B']
    },
    {
      id: 6,
      name: 'Lakeside Tennis',
      openingHours: '08:30',
      closingHours: '21:00',
      closedDays: ['Tuesday'],
      courts: ['Lake 1', 'Lake 2', 'Lake 3']
    },
    {
      id: 7,
      name: 'City Gym Courts',
      openingHours: '07:00',
      closingHours: '22:30',
      closedDays: [],
      courts: ['Gym 1']
    },
    {
      id: 8,
      name: 'Hilltop Courts',
      openingHours: '09:30',
      closingHours: '18:30',
      closedDays: ['Sunday'],
      courts: ['Hill 1', 'Hill 2']
    },
    {
      id: 9,
      name: 'University Sports Complex',
      openingHours: '08:00',
      closingHours: '20:30',
      closedDays: ['Sunday'],
      courts: ['Uni A', 'Uni B', 'Uni C', 'Uni D']
    },
    {
      id: 10,
      name: 'Community Courts',
      openingHours: '11:00',
      closingHours: '17:00',
      closedDays: ['Wednesday'],
      courts: ['Community 1', 'Community 2']
    },
    {
      id: 11,
      name: 'Forest Sports Grounds',
      openingHours: '08:00',
      closingHours: '19:30',
      closedDays: [],
      courts: ['Forest 1', 'Forest 2', 'Forest 3']
    },
    {
      id: 12,
      name: 'Downtown Courts',
      openingHours: '07:00',
      closingHours: '21:00',
      closedDays: ['Monday'],
      courts: ['DT 1', 'DT 2']
    },
    {
      id: 13,
      name: 'Harbor Sports Club',
      openingHours: '08:00',
      closingHours: '20:00',
      closedDays: ['Sunday'],
      courts: ['Harbor 1']
    },
    {
      id: 14,
      name: 'Meadow Courts',
      openingHours: '09:00',
      closingHours: '18:00',
      closedDays: ['Thursday'],
      courts: ['Meadow 1', 'Meadow 2', 'Meadow 3']
    },
    {
      id: 15,
      name: 'Grand Arena',
      openingHours: '06:30',
      closingHours: '23:00',
      closedDays: [],
      courts: ['Main 1', 'Main 2', 'Main 3', 'Main 4', 'Main 5']
    }
  ];
  /**
   * Replace with real HttpClient call in a service.
   * Current version pages the in-memory `sites` array.
   */
  private fetchPage(req: PageRequest): Observable<PageResponse<SiteDto>> {
    const start = req.pageIndex * req.pageSize;
    const items = this.sites.slice(start, start + req.pageSize);

    return of({
      items,
      pageIndex: req.pageIndex,
      pageSize: req.pageSize,
      totalItems: this.sites.length
    });
  }
}
