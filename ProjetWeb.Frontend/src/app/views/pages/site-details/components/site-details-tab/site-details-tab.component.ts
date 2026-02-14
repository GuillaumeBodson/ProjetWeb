import { ChangeDetectionStrategy, Component, computed, effect, inject, input, output } from '@angular/core';
import { CurrencyPipe, DatePipe, NgForOf, NgIf } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { CourtResponse } from '../../../../../core/api/site';
import { SiteDetailsResponse } from '../../../../../core/api/site/model/model-override';

@Component({
  selector: 'app-site-details-tab',
  standalone: true,
  imports: [
    NgIf,
    NgForOf,
    DatePipe,
    CurrencyPipe,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatChipsModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './site-details-tab.component.html',
  styleUrl: './site-details-tab.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SiteDetailsTabComponent {
  private readonly fb = inject(FormBuilder);

  // Inputs
  readonly site = input.required<SiteDetailsResponse>();
  readonly editMode = input<boolean>(false);
  readonly saving = input<boolean>(false);

  // Outputs
  readonly startEdit = output<void>();
  readonly cancelEdit = output<void>();
  readonly save = output<{ name: string; closedDays: Date[] }>();

  readonly form = this.fb.nonNullable.group({
    name: this.fb.nonNullable.control('', [Validators.required, Validators.minLength(2)]),
    revenue: this.fb.nonNullable.control({ value: 0, disabled: true }, [Validators.required, Validators.min(0)]),
    closedDays: this.fb.nonNullable.control(''),
    courts: this.fb.nonNullable.control({ value: '', disabled: true }),
  });

  readonly canSave = computed(() => this.editMode() && this.form.valid && !this.saving());

  constructor() {
    // Initialize form when site changes
    effect(() => {
      const site = this.site();
      if (site) {
        this.initializeForm(site);
      }
    });
  }

  private initializeForm(site: SiteDetailsResponse): void {
    this.form.patchValue(
      {
        name: site.name ?? '',
        revenue: site.revenue ?? 0,
        closedDays: (site.closedDays ?? []).map((d: Date) => d.toISOString().split('T')[0]).join(', '),
        courts: (site.courts ?? []).map((c: CourtResponse) => String(c.number)).join(', '),
      },
      { emitEvent: false }
    );
  }

  onStartEdit(): void {
    this.startEdit.emit();
    this.form.markAsPristine();
  }

  onCancelEdit(): void {
    this.cancelEdit.emit();
    this.initializeForm(this.site());
  }

  onSave(): void {
    if (!this.form.valid) {
      this.form.markAllAsTouched();
      return;
    }

    const closedDays = this.splitCsv(this.form.controls.closedDays.value)
      .map(s => new Date(s))
      .filter(d => !Number.isNaN(d.getTime()));

    this.save.emit({
      name: this.form.controls.name.value.trim(),
      closedDays
    });
  }

  private splitCsv(value: string): string[] {
    return (value ?? '')
      .split(',')
      .map(s => s.trim())
      .filter(s => s.length > 0);
  }
}


