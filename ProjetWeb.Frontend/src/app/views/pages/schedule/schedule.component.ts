import { Component, ChangeDetectionStrategy, inject, signal, computed } from '@angular/core';
import { CommonModule, AsyncPipe } from '@angular/common';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { ScheduleService } from './services/schedule.service';
import { WeeklyPlannerComponent } from './components/weekly-planner/weekly-planner.component';
import { PlannedDayResponse } from '../../../core/api/site';
import { SiteDetailsResponse } from '../../../core/api/site/model/model-override';
import { getISOWeek } from 'date-fns';
import { EMPTY, Subject, of } from 'rxjs';
import { catchError, switchMap, tap } from 'rxjs/operators';
import { toSignal } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-schedule',
  standalone: true,
  imports: [
    CommonModule,
    AsyncPipe,
    MatSelectModule,
    MatFormFieldModule,
    MatProgressSpinnerModule,
    MatButtonModule,
    MatIconModule,
    WeeklyPlannerComponent
  ],
  templateUrl: './schedule.component.html',
  styleUrl: './schedule.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ScheduleComponent {
  private readonly scheduleService = inject(ScheduleService);
  private readonly siteSelection$ = new Subject<string | null>();

  readonly sites$ = this.scheduleService.getAllSites();
  readonly selectedSiteId = signal<string>('');
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly selectedWeekNumber = signal<number>(this.getCurrentISOWeek());

  readonly canGoToPreviousWeek = computed(() => this.selectedWeekNumber() > 1);
  readonly canGoToNextWeek = computed(() => this.selectedWeekNumber() < 53);

  readonly siteDetails = toSignal(
    this.siteSelection$.pipe(
      switchMap(siteId => {
        if (!siteId) {
          return of(null);
        }
        this.loading.set(true);
        this.error.set(null);
        return this.scheduleService.getSiteWithSchedule(siteId).pipe(
          tap(() => {
            this.loading.set(false);
            this.selectedWeekNumber.set(this.getCurrentISOWeek());
          }),
          catchError((err: unknown) => {
            console.error('Failed to load site schedule:', err);
            this.error.set('Failed to load site schedule. Please try again.');
            this.loading.set(false);
            return EMPTY;
          })
        );
      })
    ),
    { initialValue: null as SiteDetailsResponse | null }
  );

  /**
   * Get the current ISO week number
   */
  private getCurrentISOWeek(): number {
    return getISOWeek(new Date());
  }

  /**
   * Handle site selection change
   */
  onSiteSelected(siteId: string): void {
    this.selectedSiteId.set(siteId);
    this.siteSelection$.next(siteId || null);
  }

  /**
   * Navigate to the previous week
   */
  goToPreviousWeek(): void {
    if (this.canGoToPreviousWeek()) {
      this.selectedWeekNumber.update(week => week - 1);
    }
  }

  /**
   * Navigate to the next week
   */
  goToNextWeek(): void {
    if (this.canGoToNextWeek()) {
      this.selectedWeekNumber.update(week => week + 1);
    }
  }

  /**
   * Check if a site is selected
   */
  isSiteSelected(): boolean {
    return !!this.selectedSiteId();
  }
}
