import { CommonModule} from '@angular/common';
import {ChangeDetectionStrategy, Component, inject, signal} from '@angular/core';
import { PaginationComponent } from '../../shared/components/pagination/pagination.component';
import { PageRequest, PageResponse } from '../../shared/types/paging';
import {
  BehaviorSubject,
  catchError,
  distinctUntilChanged,
  finalize,
  Observable,
  of,
  shareReplay,
  switchMap,
  tap
} from 'rxjs';
import {AuthService, LoginRequestDto} from '../../../core/api/auth';
type Item = { id: number; name: string };

@Component({
  selector: 'app-pagination-demo',
  imports: [CommonModule, PaginationComponent],
  templateUrl: './pagination-demo.component.html',
  styleUrl: './pagination-demo.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PaginationDemoComponent {
  private authService = inject(AuthService);

  login() {
    const request: LoginRequestDto = { email: 'test@example.com', password: 'Password123!' };
    console.log('Logging in with', request);
    this.authService.apiAuthLoginPost(request).subscribe(response => {
      console.log('Token:', response.token);
    });
  }


  loading = signal(false);

  all: Item[] = Array.from({ length: 137 }, (_, i) => ({ id: i + 1, name: `Item ${i + 1}` }));


  private readonly requestSubject = new BehaviorSubject<PageRequest>({ pageIndex: 0, pageSize: 10 });
  readonly request$ = this.requestSubject.asObservable();

  // Replace with real HttpClient call in a service.
  private fetchPage(req: PageRequest): Observable<PageResponse<Item>> {
    const start = req.pageIndex * req.pageSize;
    const items = this.all.slice(start, start + req.pageSize);

    // Simulated latency:
    return of({
      items,
      pageIndex: req.pageIndex,
      pageSize: req.pageSize,
      totalItems: this.all.length
    });
  }

  readonly page$ = this.request$.pipe(
    distinctUntilChanged((a, b) => a.pageIndex === b.pageIndex && a.pageSize === b.pageSize),
    tap(() => (this.loading.set(true))),
    switchMap((req) =>
      this.fetchPage(req).pipe(
        catchError(() =>
          of({
            items: [],
            pageIndex: req.pageIndex,
            pageSize: req.pageSize,
            totalItems: 0
          })
        ),
        finalize(() => (this.loading.set(false)))
      )
    ),
    shareReplay({ bufferSize: 1, refCount: true })
  );

  onPageChange(req: PageRequest): void {
    this.requestSubject.next(req);
  }
}
