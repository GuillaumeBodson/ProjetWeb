import { Component, OnInit, OnDestroy, ChangeDetectionStrategy, inject, signal, computed } from '@angular/core';
import { CommonModule, AsyncPipe } from '@angular/common';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { ScheduleService } from './services/schedule.service';
import { WeeklyPlannerComponent } from './components/weekly-planner/weekly-planner.component';
import { PlannedDayResponse } from '../../../core/api/site';
import { SiteResponse, SiteDetailsResponse } from '../../../core/api/site/model/model-override';
import { getISOWeek } from 'date-fns';
import { EMPTY, Subject } from 'rxjs';
import { catchError, switchMap, takeUntil } from 'rxjs/operators';

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
export class ScheduleComponent implements OnInit, OnDestroy {
  private readonly scheduleService = inject(ScheduleService);
  private readonly siteSelection$ = new Subject<string>();
  private readonly destroy$ = new Subject<void>();

  // Signals
  sites$ = this.scheduleService.getAllSites();
  selectedSiteId = signal<string>('');
  siteDetails = signal<SiteDetailsResponse | null>(null);
  loading = signal(false);
  error = signal<string | null>(null);
  selectedWeekNumber = signal<number>(this.getCurrentISOWeek());

  canGoToPreviousWeek = computed(() => this.selectedWeekNumber() > 1);
  canGoToNextWeek = computed(() => this.selectedWeekNumber() < 53);

  ngOnInit(): void {
    this.siteSelection$.pipe(
      switchMap(siteId => {
        this.loading.set(true);
        this.error.set(null);
        return this.scheduleService.getSiteWithSchedule(siteId).pipe(
          catchError((err: any) => {
            console.error('Failed to load site schedule:', err);
            this.error.set('Failed to load site schedule. Please try again.');
            this.loading.set(false);
            return EMPTY;
          })
        );
      }),
      takeUntil(this.destroy$)
    ).subscribe((details: SiteDetailsResponse) => {
      this.siteDetails.set(details);
      this.loading.set(false);
      // Reset to current week when selecting a new site
      this.selectedWeekNumber.set(this.getCurrentISOWeek());
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

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
    if (!siteId) {
      this.siteDetails.set(null);
      this.selectedSiteId.set('');
      return;
    }

    this.selectedSiteId.set(siteId);
    this.siteSelection$.next(siteId);
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
