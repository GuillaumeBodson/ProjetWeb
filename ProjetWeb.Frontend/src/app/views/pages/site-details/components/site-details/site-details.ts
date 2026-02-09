import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { AsyncPipe, CurrencyPipe, DatePipe, NgClass, NgForOf, NgIf } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import {catchError, map, of, shareReplay, switchMap, take, tap} from 'rxjs';

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
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';

import { SiteService } from '../../../sites-list/services/site-service';
import {
  UpdateSiteRequest,
  DayOfWeek,
  PlannedDayResponse,
  TimeSlotResponse,
  CourtResponse
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
    MatTableModule,
    MatTooltipModule,
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
            closedDays: (site.closedDays ?? []).map(d => d.toISOString().split('T')[0]).join(', '),
            courts: (site.courts ?? []).map(c => String(c.number)).join(', '),
          },
          { emitEvent: false }
        );
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
    map(site => site?.schedule.flatMap(d => d.timeSlots))//.filter(d => d.d).bookings?.filter(b => new Date(b.startTime) > new Date()) ?? [])
  );

  // Schedule table data
  readonly daysOfWeek: DayOfWeek[] = [
    DayOfWeek.Monday,
    DayOfWeek.Tuesday,
    DayOfWeek.Wednesday,
    DayOfWeek.Thursday,
    DayOfWeek.Friday,
    DayOfWeek.Saturday,
    DayOfWeek.Sunday,
  ];

  readonly scheduleData$ = this.site$.pipe(
    map(site => {
      if (!site?.schedule?.length) {
        return { rows: [], maxTimeSlots: 0 };
      }

      // Since there are always 7 planned days (one per day of week), create a map
      const dayMap = new Map<DayOfWeek, PlannedDayResponse>();
      site.schedule.forEach(pd => {
        dayMap.set(pd.dayOfWeek, pd);
      });

      // Find the maximum number of time slots across all days
      const maxTimeSlots = Math.max(...site.schedule.map(pd => pd.numberOfTimeSlots), 0);

      // Build rows: each row represents a time slot number (0 to maxTimeSlots - 1)
      const rows: ScheduleRow[] = [];
      for (let slotIndex = 0; slotIndex < maxTimeSlots; slotIndex++) {
        const row: ScheduleRow = {
          slotNumber: slotIndex + 1,
          slots: {}
        };

        // For each day of the week, get the corresponding time slot
        this.daysOfWeek.forEach(day => {
          const plannedDay = dayMap.get(day);
          if (plannedDay && slotIndex < plannedDay.timeSlots.length) {
            row.slots[day] = plannedDay.timeSlots[slotIndex];
          }
        });

        rows.push(row);
      }

      return { rows, maxTimeSlots };
    })
  );

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
        closedDays: (site.closedDays ?? []).map(d => d.toISOString().split('T')[0]).join(', '),
        courts: (site.courts ?? []).map(c => String(c.number)).join(', '),
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
    schedule: PlannedDayResponse[];
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

  getTimeSlot(row: ScheduleRow, day: DayOfWeek): TimeSlotResponse | undefined {
    return row.slots[day];
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
}

interface ScheduleRow {
  slotNumber: number;
  slots: Partial<Record<DayOfWeek, TimeSlotResponse>>;
}
