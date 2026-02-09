import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { AsyncPipe, NgIf } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { catchError, map, of, shareReplay, switchMap, take, tap } from 'rxjs';

import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatTabsModule } from '@angular/material/tabs';

import { SiteService } from '../../../sites-list/services/site-service';
import { UpdateSiteRequest } from '../../../../../core/api/site';
import { SiteDetailsResponse } from '../../../../../core/api/site/model/model-override';
import { SiteDetailsTabComponent } from '../site-details-tab/site-details-tab.component';
import { BookingsTabComponent } from '../bookings-tab/bookings-tab.component';
import { ScheduleTabComponent, ScheduleUpdateData } from '../schedule-tab/schedule-tab.component';

@Component({
  selector: 'app-site-details',
  standalone: true,
  imports: [
    NgIf,
    AsyncPipe,
    MatToolbarModule,
    MatTabsModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatProgressSpinnerModule,
    SiteDetailsTabComponent,
    BookingsTabComponent,
    ScheduleTabComponent,
  ],
  templateUrl: './site-details.html',
  styleUrl: './site-details.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SiteDetails {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly siteService = inject(SiteService);

  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly editMode = signal(false);

  readonly id$ = this.route.paramMap.pipe(
    map(pm => pm.get('id')),
    shareReplay({ bufferSize: 1, refCount: true })
  );

  readonly site$ = this.id$.pipe(
    tap(() => this.loading.set(true)),
    switchMap(id => {
      if (!id) {
        return of<SiteDetailsResponse | null>(null);
      }
      return this.siteService.getById(id);
    }),
    tap(() => this.loading.set(false)),
    catchError(err => {
      console.error('Failed to load site details', err);
      this.loading.set(false);
      return of<SiteDetailsResponse | null>(null);
    }),
    shareReplay({ bufferSize: 1, refCount: true })
  );

  readonly futureBookings$ = this.site$.pipe(
    map(site => site?.schedule?.flatMap((d: any) => d.timeSlots) ?? [])
  );

  async goBack(): Promise<void> {
    await this.router.navigate(['/sites']);
  }

  startEdit(): void {
    this.editMode.set(true);
  }

  cancelEdit(): void {
    this.editMode.set(false);
  }

  onDetailsSave(data: { name: string; closedDays: Date[] }): void {
    this.site$.pipe(
      take(1),
      switchMap(site => {
        if (!site) {
          return of(null);
        }

        const updated: UpdateSiteRequest = {
          name: data.name,
          closedDays: data.closedDays.map(d => d.toISOString()),
          courts: site.courts.map(c => ({ number: c.number }))
        };

        this.saving.set(true);
        return this.id$.pipe(
          take(1),
          switchMap(id => {
            if (!id) {
              this.saving.set(false);
              return of(null);
            }
            return this.siteService.update(id, updated);
          })
        );
      }),
      tap(() => {
        this.saving.set(false);
        this.editMode.set(false);
      }),
      catchError(err => {
        console.error('Failed to save site', err);
        this.saving.set(false);
        return of(null);
      })
    ).subscribe();
  }

  onScheduleSave(data: ScheduleUpdateData): void {
    // TODO: Implement schedule update API endpoint
    // For now, just log the data
    console.log('Schedule save requested:', data);
    console.warn('Schedule update not yet implemented - API endpoint needed');
  }
}

