import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { PaginationComponent } from '../../shared/components/pagination/pagination.component';
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
import { AuthService, LoginRequest } from '../../../core/api/auth';

type Item = { id: number; name: string };

// Custom page response for demo items (not using SiteResponse)
interface ItemPageResponse {
  pageNumber: number;
  pageSize: number;
  totalItems: number;
  items: Item[];
}

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
    const request: LoginRequest = { email: 'test@example.com', password: 'Password123!' };
    console.log('Logging in with', request);
    this.authService.apiAuthLoginPost(request).subscribe(response => {
      console.log('Token:', response.token);
    });
  }

  loading = signal(false);

  all: Item[] = Array.from({ length: 137 }, (_, i) => ({ id: i + 1, name: `Item ${i + 1}` }));

  private readonly requestSubject = new BehaviorSubject<{ pageNumber: number; pageSize: number }>({
    pageNumber: 1,
    pageSize: 10
  });
  readonly request$ = this.requestSubject.asObservable();

  private fetchPage(req: { pageNumber: number; pageSize: number }): Observable<ItemPageResponse> {
    const start = (req.pageNumber - 1) * req.pageSize;
    const items = this.all.slice(start, start + req.pageSize);

    return of({
      items,
      pageNumber: req.pageNumber,
      pageSize: req.pageSize,
      totalItems: this.all.length
    });
  }

  readonly page$ = this.request$.pipe(
    distinctUntilChanged((a, b) => a.pageNumber === b.pageNumber && a.pageSize === b.pageSize),
    tap(() => this.loading.set(true)),
    switchMap((req) =>
      this.fetchPage(req).pipe(
        catchError(() =>
          of({
            items: [],
            pageNumber: req.pageNumber,
            pageSize: req.pageSize,
            totalItems: 0
          })
        ),
        finalize(() => this.loading.set(false))
      )
    ),
    shareReplay({ bufferSize: 1, refCount: true })
  );

  onPageChange(req: { pageIndex: number; pageSize: number }): void {
    // Convert 0-based pageIndex to 1-based pageNumber
    this.requestSubject.next({
      pageNumber: req.pageIndex + 1,
      pageSize: req.pageSize
    });
  }
}
