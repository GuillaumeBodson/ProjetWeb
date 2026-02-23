import { Component, OnInit, ChangeDetectionStrategy, inject, signal, computed } from '@angular/core';
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
import { Observable } from 'rxjs';

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
export class ScheduleComponent implements OnInit {
  private readonly scheduleService = inject(ScheduleService);

  // Signals
  sites$ = new Observable<SiteResponse[]>();
  selectedSiteId = signal<string>('');
  siteDetails = signal<SiteDetailsResponse | null>(null);
  loading = signal(false);
  error = signal<string | null>(null);
  selectedWeekNumber = signal<number>(this.getCurrentISOWeek());

  // Computed values
  filteredSchedule = computed(() => {
    const details = this.siteDetails();

    if (!details) return [];

    return details.schedule.filter(
      (plannedDay: PlannedDayResponse) => plannedDay.id // Assuming we need all days for the week
    );
  });

  canGoToPreviousWeek = computed(() => this.selectedWeekNumber() > 1);
  canGoToNextWeek = computed(() => this.selectedWeekNumber() < 53);

  ngOnInit(): void {
    this.sites$ = this.scheduleService.getAllSites();
  }

  /**
   * Get the current ISO week number
   */
  private getCurrentISOWeek(): number {
    const now = new Date();
    const nearestThursday = new Date(now);
    nearestThursday.setDate(now.getDate() - now.getDay() + 4); // Thursday

    const yearStart = new Date(nearestThursday.getFullYear(), 0, 1);

    const diff = nearestThursday.getTime() - yearStart.getTime();
    const oneWeek = 1000 * 60 * 60 * 24 * 7;
    const week = Math.floor(diff / oneWeek) + 1;

    return week;
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
    this.loading.set(true);
    this.error.set(null);

    this.scheduleService.getSiteWithSchedule(siteId).subscribe({
      next: (details: SiteDetailsResponse) => {
        this.siteDetails.set(details);
        this.loading.set(false);
        // Reset to current week when selecting a new site
        this.selectedWeekNumber.set(this.getCurrentISOWeek());
      },
      error: (err: any) => {
        console.error('Failed to load site schedule:', err);
        this.error.set('Failed to load site schedule. Please try again.');
        this.loading.set(false);
      }
    });
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
