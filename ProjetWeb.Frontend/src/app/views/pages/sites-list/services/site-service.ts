import { Injectable, inject } from '@angular/core';
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
import { map } from 'rxjs/operators';
import { SiteFacadeService } from '../../../../core/services/site-facade.service';
import {
  PageOfOfSiteResponse,
  PageRequest,
  SiteResponse,
  UpdateSiteRequest,
  FilterGroup
} from '../../../../core/api/site';

@Injectable({
  providedIn: 'root'
})
export class SiteService {
  private readonly siteFacade = inject(SiteFacadeService);

  private readonly requestSubject = new BehaviorSubject<PageRequest>({ pageNumber: 1, pageSize: 10 });
  readonly request$ = this.requestSubject.asObservable();

  private readonly filterSubject = new BehaviorSubject<FilterGroup | null>(null);
  readonly filter$ = this.filterSubject.asObservable().pipe(
    distinctUntilChanged((a, b) => JSON.stringify(a) === JSON.stringify(b))
  );

  private readonly refreshTrigger$ = new Subject<void>();

  readonly page$: Observable<PageOfOfSiteResponse> = merge(
    combineLatest([
      this.request$.pipe(
        distinctUntilChanged((a, b) => a.pageNumber === b.pageNumber && a.pageSize === b.pageSize)
      ),
      this.filter$
    ]),
    this.refreshTrigger$.pipe(switchMap(() => combineLatest([this.request$, this.filter$])))
  ).pipe(
    switchMap(([req, filter]) =>
      this.fetchPage(req, filter).pipe(
        catchError((err) => {
          console.error('Failed to fetch sites page', { request: req, filter, error: err });
          return of({
            items: [],
            pageNumber: req.pageNumber,
            pageSize: req.pageSize,
            totalItems: 0
          } satisfies PageOfOfSiteResponse);
        })
      )
    ),
    shareReplay({ bufferSize: 1, refCount: true })
  );

  onPageChange(pageRequest: { pageIndex: number; pageSize: number }): void {
    this.requestSubject.next({
      pageNumber: pageRequest.pageIndex + 1,
      pageSize: pageRequest.pageSize
    });
  }

  setFilter(filter: FilterGroup | null): void {
    this.filterSubject.next(filter);
    const current = this.requestSubject.value;
    this.requestSubject.next({ ...current, pageNumber: 1 });
  }

  clearFilter(): void {
    this.setFilter(null);
  }

  refresh(): void {
    this.refreshTrigger$.next();
  }

  private fetchPage(req: PageRequest, filter: FilterGroup | null): Observable<PageOfOfSiteResponse> {
    const apiFilters = filter ? [filter] : undefined;

    return this.siteFacade.getSitesPaginated(
      req.pageNumber,
      req.pageSize,
      apiFilters,
      undefined
    );
  }

  getById(id: number): Observable<SiteResponse | null> {
    return this.siteFacade.getSiteById(id.toString()).pipe(
      catchError(error => {
        console.error(`Failed to fetch site with ID: ${id}`, error);
        return of(null);
      })
    );
  }

  update(siteId: string, updateRequest: UpdateSiteRequest): Observable<SiteResponse> {
    return this.siteFacade.updateSite(siteId, updateRequest).pipe(
      map(updated => {
        this.refresh();
        return updated;
      })
    );
  }
}
