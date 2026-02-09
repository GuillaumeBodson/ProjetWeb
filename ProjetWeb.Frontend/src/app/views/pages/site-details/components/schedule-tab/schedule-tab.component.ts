import { ChangeDetectionStrategy, Component, computed, effect, inject, input, output, signal } from '@angular/core';
import { NgForOf, NgIf } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { DayOfWeek, PlannedDayResponse } from '../../../../../core/api/site';

export interface ScheduleUpdateData {
  schedule: Array<{
    dayOfWeek: DayOfWeek;
    numberOfTimeSlots: number;
    startTime: string | null;
  }>;
}

@Component({
  selector: 'app-schedule-tab',
  standalone: true,
  imports: [
    NgIf,
    NgForOf,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './schedule-tab.component.html',
  styleUrl: './schedule-tab.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ScheduleTabComponent {
  private readonly fb = inject(FormBuilder);

  // Inputs
  readonly schedule = input.required<PlannedDayResponse[]>();
  readonly saving = input<boolean>(false);

  // Outputs
  readonly saveSchedule = output<ScheduleUpdateData>();

  readonly editMode = signal(false);

  readonly daysOfWeek: DayOfWeek[] = [
    DayOfWeek.Monday,
    DayOfWeek.Tuesday,
    DayOfWeek.Wednesday,
    DayOfWeek.Thursday,
    DayOfWeek.Friday,
    DayOfWeek.Saturday,
    DayOfWeek.Sunday,
  ];

  readonly scheduleForm = this.fb.array(
    this.daysOfWeek.map(() =>
      this.fb.group({
        numberOfTimeSlots: this.fb.control<number>(0, [Validators.required, Validators.min(0), Validators.max(8)]),
        startTime: this.fb.control<string>('08:00')
      })
    )
  );

  constructor() {
    // Initialize form when schedule changes
    effect(() => {
      const schedule = this.schedule();
      if (schedule?.length) {
        this.initializeForm(schedule);
      }
    });
  }

  private initializeForm(schedule: PlannedDayResponse[]): void {
    const dayMap = new Map<DayOfWeek, PlannedDayResponse>();
    schedule.forEach(pd => dayMap.set(pd.dayOfWeek, pd));

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

  startEdit(): void {
    this.editMode.set(true);
    this.scheduleForm.markAsPristine();
  }

  cancelEdit(): void {
    this.editMode.set(false);
    this.initializeForm(this.schedule());
  }

  onSave(): void {
    if (!this.scheduleForm.valid) {
      this.scheduleForm.markAllAsTouched();
      return;
    }

    const scheduleData: ScheduleUpdateData = {
      schedule: this.daysOfWeek.map((day, index) => {
        const formValue = this.scheduleForm.at(index).value;
        return {
          dayOfWeek: day,
          numberOfTimeSlots: formValue.numberOfTimeSlots ?? 0,
          startTime: formValue.startTime ?? null
        };
      })
    };

    this.saveSchedule.emit(scheduleData);
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

