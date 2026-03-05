import { Component, ChangeDetectionStrategy, inject, signal, computed, effect } from '@angular/core';
import { CommonModule, AsyncPipe } from '@angular/common';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { ScheduleService } from './services/schedule.service';
import { WeeklyPlannerComponent } from './components/weekly-planner/weekly-planner.component';
import { DaySchedule } from './models';
import { getISOWeek } from 'date-fns';
import { EMPTY } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';

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

  readonly sites$ = this.scheduleService.getAllSites();
  readonly selectedSiteId = signal<string>('');
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly selectedWeekNumber = signal<number>(this.getCurrentISOWeek());
  readonly daySchedules = signal<DaySchedule[]>([]);

  readonly canGoToPreviousWeek = computed(() => this.selectedWeekNumber() > 1);
  readonly canGoToNextWeek = computed(() => this.selectedWeekNumber() < 53);

  constructor() {
    // Effect to load schedule when site or week changes
    effect(() => {
      const siteId = this.selectedSiteId();
      const weekNumber = this.selectedWeekNumber();

      if (siteId) {
        this.loadSchedule(siteId, weekNumber);
      } else {
        this.daySchedules.set([]);
      }
    });
  }

  /**
   * Load schedule for a specific site and week
   */
  private loadSchedule(siteId: string, weekNumber: number): void {
    this.loading.set(true);
    this.error.set(null);

    this.scheduleService.getScheduleForWeek(siteId, weekNumber, 1).pipe(
      tap((schedules) => {
        this.daySchedules.set(schedules);
        this.loading.set(false);
      }),
      catchError((err: unknown) => {
        console.error('Failed to load site schedule:', err);
        this.error.set('Failed to load site schedule. Please try again.');
        this.loading.set(false);
        this.daySchedules.set([]);
        return EMPTY;
      })
    ).subscribe();
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
    this.selectedSiteId.set(siteId);
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
