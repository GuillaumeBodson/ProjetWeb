import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { AsyncPipe, CurrencyPipe, DatePipe, NgClass, NgForOf, NgIf } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { catchError, map, of, shareReplay, switchMap, take, tap } from 'rxjs';

import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatTabsModule } from '@angular/material/tabs';

import { SiteService } from '../../../sites-list/services/site-service';
import {
  UpdateSiteRequest,
  DayOfWeek,
  CourtResponse, PlannedDayResponse
} from '../../../../../core/api/site';
import { SiteDetailsResponse } from '../../../../../core/api/site/model/model-override';

@Component({
  selector: 'app-site-details',
  standalone: true,
  imports: [
    NgIf,
    NgForOf,
    NgClass,
    AsyncPipe,
    CurrencyPipe,
    DatePipe,
    ReactiveFormsModule,
    MatToolbarModule,
    MatTabsModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatDividerModule,
    MatFormFieldModule,
    MatInputModule,
    MatChipsModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './site-details.html',
  styleUrl: './site-details.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SiteDetails {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);
  private readonly siteService = inject(SiteService);

  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly editMode = signal(false);

  readonly id$ = this.route.paramMap.pipe(
    map(pm => (pm.get('id'))),
    shareReplay({ bufferSize: 1, refCount: true })
  );

  readonly site$ = this.id$.pipe(
    tap(() => this.loading.set(true)),
    switchMap(id => {
      if (!id) {
        return of<SiteDetailsResponse | null>(null);
      }
      return this.siteService.getById(id).pipe(
        map(site => {
          if (!site) {
            return null;
          }
          return site;
        })
      );
    }),
    tap(site => {
      this.loading.set(false);
      if (site) {
        this.form.patchValue(
          {
            name: site.name ?? '',
            revenue: site.revenue ?? 0,
            closedDays: (site.closedDays ?? []).map((d: Date) => d.toISOString().split('T')[0]).join(', '),
            courts: (site.courts ?? []).map((c: CourtResponse) => String(c.number)).join(', '),
          },
          { emitEvent: false }
        );
        this.initializeScheduleForm(site);
      }
    }),
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

  // Days of the week for schedule configuration
  readonly daysOfWeek: DayOfWeek[] = [
    DayOfWeek.Monday,
    DayOfWeek.Tuesday,
    DayOfWeek.Wednesday,
    DayOfWeek.Thursday,
    DayOfWeek.Friday,
    DayOfWeek.Saturday,
    DayOfWeek.Sunday,
  ];

  // Schedule form for editing opening hours configuration
  readonly scheduleForm = this.fb.array(
    this.daysOfWeek.map(() =>
      this.fb.group({
        numberOfTimeSlots: this.fb.control<number>(0, [Validators.required, Validators.min(0), Validators.max(8)]),
        startTime: this.fb.control<string>('08:00')
      })
    )
  );

  readonly scheduleEditMode = signal(false);

  readonly form = this.fb.nonNullable.group({
    name: this.fb.nonNullable.control('', [Validators.required, Validators.minLength(2)]),

    // Read-only fields (kept in the form for easy binding/display in edit mode).
    revenue: this.fb.nonNullable.control({ value: 0, disabled: true }, [Validators.required, Validators.min(0)]),

    // Simple mobile-friendly editor for closedDays: comma-separated ISO dates.
    closedDays: this.fb.nonNullable.control(''),

    // Read-only
    courts: this.fb.nonNullable.control({ value: '', disabled: true }),
  });

  readonly canSave = computed(() => this.editMode() && this.form.valid && !this.saving());

  startEdit(): void {
    this.editMode.set(true);
    this.form.markAsPristine();
  }

  cancelEdit(): void {
    this.editMode.set(false);
    // Reset form back to latest loaded site values.
    this.site$.pipe(
      //The take(1) operator ensures the subscription completes immediately after receiving the first value,
      // preventing any memory leaks.
      take(1),
      tap(site => {
      if (!site) {
        return;
      }
      this.form.reset({
        name: site.name ?? '',
        revenue: site.revenue ?? 0,
        closedDays: (site.closedDays ?? []).map((d: Date) => d.toISOString().split('T')[0]).join(', '),
        courts: (site.courts ?? []).map((c: CourtResponse) => String(c.number)).join(', '),
      });
    })).subscribe({ complete: () => {} });
  }

  async goBack(): Promise<void> {
    await this.router.navigate(['/sites']);
  }

  save(site: {
    id: string;
    name: string;
    revenue: number;
    closedDays: Date[] | string[];
    courts: CourtResponse[];
    schedule: any[];
  }): void {
    if (!this.form.valid) {
      this.form.markAllAsTouched();
      return;
    }

    const closedDays = this.splitCsv(this.form.controls.closedDays.value)
      .map(s => new Date(s))
      .filter(d => !Number.isNaN(d.getTime()));

    // Keep schedule and courts unchanged from the original site
    const updated: UpdateSiteRequest = {
      name: this.form.controls.name.value.trim(),
      closedDays: closedDays.map(d => d.toISOString()),
      courts: site.courts.map(c => ({ number: c.number })),
      schedule: site.schedule.map(pd => ({
        dayOfWeek: pd.dayOfWeek,
        numberOfTimeSlots: pd.numberOfTimeSlots,
        startTime: pd.startTime
      }))
    };

    this.saving.set(true);

    this.id$.pipe(
      take(1),
      switchMap(id => {
        if (!id) {
          this.saving.set(false);
          return of(null);
        }
        return this.siteService.update(id, updated);
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

  private splitCsv(value: string): string[] {
    return (value ?? '')
      .split(',')
      .map(s => s.trim())

  }

  getCourtNumber(courtId: string, courts: CourtResponse[]): number | undefined {
    return courts.find(c => c.id === courtId)?.number;
  }

  formatTime(dateTime: string): string {
    const date = new Date(dateTime);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
  }

  getBookStateColor(state: string): string {
    switch (state) {
      case 'Available':
        return 'bg-green-100 text-green-800';
      case 'Booked':
        return 'bg-red-100 text-red-800';
      case 'Unavailable':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-blue-100 text-blue-800';
    }
  }

  // Schedule management methods
  private initializeScheduleForm(site: SiteDetailsResponse | null): void {
    if (!site?.schedule?.length) {
      return;
    }

    const dayMap = new Map<DayOfWeek, PlannedDayResponse>();
    site.schedule.forEach(pd => dayMap.set(pd.dayOfWeek, pd));

    this.daysOfWeek.forEach((day, index) => {
      const plannedDay = dayMap.get(day);
      if (plannedDay) {
        this.scheduleForm.at(index).patchValue({
          numberOfTimeSlots: plannedDay.numberOfTimeSlots,
          startTime: plannedDay.startTime
        }, { emitEvent: false });
      }
    });
  }

  startScheduleEdit(): void {
    this.scheduleEditMode.set(true);
    this.scheduleForm.markAsPristine();
  }

  cancelScheduleEdit(): void {
    this.scheduleEditMode.set(false);
    this.site$.pipe(
      take(1),
      tap(site => this.initializeScheduleForm(site))
    ).subscribe();
  }

  saveSchedule(site: {
    id: string;
    name: string;
    revenue: number;
    closedDays: Date[] | string[];
    courts: CourtResponse[];
    schedule: any[];
  }): void {
    if (!this.scheduleForm.valid) {
      this.scheduleForm.markAllAsTouched();
      return;
    }

    const updated: UpdateSiteRequest = {
      name: site.name,
      closedDays: Array.isArray(site.closedDays) ?
        site.closedDays.map(d => d instanceof Date ? d.toISOString() : d) :
        [],
      courts: site.courts.map(c => ({ number: c.number })),
      schedule: this.daysOfWeek.map((day, index) => {
        const formValue = this.scheduleForm.at(index).value;
        return {
          dayOfWeek: day,
          numberOfTimeSlots: formValue.numberOfTimeSlots ?? 0,
          startTime: formValue.startTime ?? null
        };
      })
    };

    this.saving.set(true);

    this.id$.pipe(
      take(1),
      switchMap(id => {
        if (!id) {
          this.saving.set(false);
          return of(null);
        }
        return this.siteService.update(id, updated);
      }),
      tap(() => {
        this.saving.set(false);
        this.scheduleEditMode.set(false);
      }),
      catchError(err => {
        console.error('Failed to save schedule', err);
        this.saving.set(false);
        return of(null);
      })
    ).subscribe();
  }

  getDayName(day: DayOfWeek): string {
    const names: Record<DayOfWeek, string> = {
      [DayOfWeek.Monday]: 'Monday',
      [DayOfWeek.Tuesday]: 'Tuesday',
      [DayOfWeek.Wednesday]: 'Wednesday',
      [DayOfWeek.Thursday]: 'Thursday',
      [DayOfWeek.Friday]: 'Friday',
      [DayOfWeek.Saturday]: 'Saturday',
      [DayOfWeek.Sunday]: 'Sunday'
    };
    return names[day];
  }
}
