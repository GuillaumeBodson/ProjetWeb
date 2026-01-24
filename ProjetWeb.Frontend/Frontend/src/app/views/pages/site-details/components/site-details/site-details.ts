import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { AsyncPipe, CurrencyPipe, DatePipe, NgForOf, NgIf } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { catchError, map, of, shareReplay, switchMap, tap } from 'rxjs';

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
import { Court, Booking } from '../types/court';
import {SiteDto} from '../../../sites-list/types/site';

@Component({
  selector: 'app-site-details',
  standalone: true,
  imports: [
    NgIf,
    NgForOf,
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
    map(pm => Number(pm.get('id'))),
    map(id => (Number.isFinite(id) ? id : NaN)),
    shareReplay({ bufferSize: 1, refCount: true })
  );

  readonly site$ = this.id$.pipe(
    tap(() => this.loading.set(true)),
    switchMap(id => {
      if (!Number.isFinite(id)) {
        return of<SiteDto | null>(null);
      }
      // Reuse SiteService demo data and adapt to the richer SiteDetails model.
      return this.siteService.getById(id).pipe(
        map(site => {
          if (!site) {
            return null;
          }
          return site as SiteDto;
        })
      );
    }),
    tap(site => {
      this.loading.set(false);
      if (site) {
        this.form.patchValue(
          {
            name: site.name ?? '',
            openingHours: site.openingHours ?? '',
            closingHours: site.closingHours ?? '',
            revenue: site.revenue ?? 0,
            closedDays: (site.closedDays ?? []).map(d => d.toISOString().slice(0, 10)).join(', '),
            courts: (site.courts ?? []).map(c => String(c.number)).join(', '),
          },
          { emitEvent: false }
        );
      }
    }),
    catchError(err => {
      console.error('Failed to load site details', err);
      this.loading.set(false);
      return of<SiteDto | null>(null);
    }),
    shareReplay({ bufferSize: 1, refCount: true })
  );

  readonly futureBookings$ = this.site$.pipe(
    map(site => site?.bookings?.filter(b => new Date(b.startTime) > new Date()) ?? [])
  );

  readonly form = this.fb.nonNullable.group({
    name: this.fb.nonNullable.control('', [Validators.required, Validators.minLength(2)]),
    openingHours: this.fb.nonNullable.control('', [Validators.required]),
    closingHours: this.fb.nonNullable.control('', [Validators.required]),

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
    this.site$.pipe(tap(site => {
      if (!site) {
        return;
      }
      this.form.reset({
        name: site.name ?? '',
        openingHours: site.openingHours ?? '',
        closingHours: site.closingHours ?? '',
        revenue: site.revenue ?? 0,
        closedDays: (site.closedDays ?? []).map(d => d.toISOString().slice(0, 10)).join(', '),
        courts: (site.courts ?? []).map(c => String(c.number)).join(', '),
      });
    })).subscribe({ complete: () => {} });
  }

  async goBack(): Promise<void> {
    await this.router.navigate(['/sites']);
  }

  save(site: SiteDto): void {
    if (!this.form.valid) {
      this.form.markAllAsTouched();
      return;
    }

    const closedDays = this.splitCsv(this.form.controls.closedDays.value)
      .map(s => new Date(s))
      .filter(d => !Number.isNaN(d.getTime()));

    // Keep revenue and courts unchanged.
    const updated: SiteDto = {
      ...site,
      name: this.form.controls.name.value.trim(),
      openingHours: this.form.controls.openingHours.value.trim(),
      closingHours: this.form.controls.closingHours.value.trim(),
      closedDays,
    };

    this.saving.set(true);

    this.siteService.update({
      id: updated.id,
      name: updated.name,
      openingHours: updated.openingHours,
      closingHours: updated.closingHours,
      revenue: site.revenue,
      closedDays: updated.closedDays,
      courts: site.courts ?? [],
      bookings: site.bookings ?? [],
    }).pipe(
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

  getCourtNumber(courtId: number, courts: Court[]): number | undefined {
    return courts.find(c => c.id === courtId)?.number;
  }
}
