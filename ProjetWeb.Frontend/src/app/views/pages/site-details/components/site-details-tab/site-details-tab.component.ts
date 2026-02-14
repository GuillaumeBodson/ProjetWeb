import { ChangeDetectionStrategy, Component, effect, inject, input, output, signal } from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { CourtResponse } from '../../../../../core/api/site';
import { SiteDetailsResponse } from '../../../../../core/api/site/model/model-override';
import { UpdateSiteRequest } from '../../../../../core/api/site/model/update-site-request';

@Component({
  selector: 'app-site-details-tab',
  standalone: true,
  imports: [
    DatePipe,
    CurrencyPipe,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
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
  readonly saving = input<boolean>(false);

  // Outputs
  readonly saveSite = output<UpdateSiteRequest>();

  readonly editMode = signal(false);

  readonly form = this.fb.nonNullable.group({
    name: this.fb.nonNullable.control('', [Validators.required, Validators.minLength(2)]),
    closedDays: this.fb.nonNullable.control(''),
    courts: this.fb.nonNullable.control(''),
  });


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
        closedDays: (site.closedDays ?? []).map((d: Date) => d.toISOString().split('T')[0]).join(', '),
        courts: (site.courts ?? []).map((c: CourtResponse) => String(c.number)).join(', '),
      },
      { emitEvent: false }
    );
  }

  startEdit(): void {
    this.editMode.set(true);
    this.form.markAsPristine();
  }

  cancelEdit(): void {
    this.editMode.set(false);
    this.initializeForm(this.site());
  }

  onSave(): void {
    if (!this.form.valid) {
      this.form.markAllAsTouched();
      return;
    }

    const closedDays = this.splitCsv(this.form.controls.closedDays.value)
      .map(s => s)
      .filter(s => s.length > 0);

    const courts = this.splitCsv(this.form.controls.courts.value)
      .map(courtNum => ({
        number: parseInt(courtNum, 10)
      }))
      .filter(c => !Number.isNaN(c.number));

    const updateRequest: UpdateSiteRequest = {
      name: this.form.controls.name.value.trim(),
      closedDays: closedDays.length > 0 ? closedDays : null,
      courts: courts.length > 0 ? courts : null
    };

    this.saveSite.emit(updateRequest);
  }

  private splitCsv(value: string): string[] {
    return (value ?? '')
      .split(',')
      .map(s => s.trim())
      .filter(s => s.length > 0);
  }
}


