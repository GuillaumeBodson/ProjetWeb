import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { DayOfWeek, PlannedDayResponse } from '../../../../../core/api/site';

interface TimeSlotUI {
  number: number;
  startTime: string;
  endTime: string;
  isAvailable: boolean;
  isBooked: boolean;
  bookState?: string;
}

export interface ScheduleTableClassMap {
  table: string;
  headerRow: string;
  timeHeader: string;
  dayHeader: string;
  dayName: string;
  slotRow: string;
  timeCell: string;
  timeLabel: string;
  slotCell: string;
  slotButton: string;
}

const DEFAULT_CLASS_MAP: ScheduleTableClassMap = {
  table: '',
  headerRow: '',
  timeHeader: '',
  dayHeader: '',
  dayName: '',
  slotRow: '',
  timeCell: '',
  timeLabel: '',
  slotCell: '',
  slotButton: ''
};

@Component({
  selector: 'app-schedule-table',
  standalone: true,
  imports: [CommonModule, MatButtonModule],
  templateUrl: './schedule-table.component.html',
  styleUrl: './schedule-table.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ScheduleTableComponent implements OnChanges {
  @Input() days: PlannedDayResponse[] = [];
  @Input() slotIndices: number[] = [];
  @Input() slotDurationMinutes = 105;
  @Input() classMap: ScheduleTableClassMap = DEFAULT_CLASS_MAP;
  @Input() weekNumber: number = 1;

  private slotCache = new Map<string, TimeSlotUI[]>();

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['days'] || changes['weekNumber'] || changes['slotDurationMinutes']) {
      this.rebuildSlotCache();
    }
  }

  private rebuildSlotCache(): void {
    this.slotCache.clear();
    for (const day of this.days ?? []) {
      this.slotCache.set(day.id, this.getTimeSlotUIData(day));
    }
  }

  getDayOfWeekName(dayOfWeek: DayOfWeek): string {
    const dayNames: Record<DayOfWeek, string> = {
      [DayOfWeek.Sunday]: 'Sunday',
      [DayOfWeek.Monday]: 'Monday',
      [DayOfWeek.Tuesday]: 'Tuesday',
      [DayOfWeek.Wednesday]: 'Wednesday',
      [DayOfWeek.Thursday]: 'Thursday',
      [DayOfWeek.Friday]: 'Friday',
      [DayOfWeek.Saturday]: 'Saturday'
    };
    return dayNames[dayOfWeek];
  }

  getTimeForSlotIndex(startTime: string, slotIndex: number): string {
    if (!startTime) return '';

    const [startHours, startMinutes] = startTime.split(':').map(Number);
    const minutesFromStart = slotIndex * this.slotDurationMinutes;
    const totalMinutes = startHours * 60 + startMinutes + minutesFromStart;

    const slotStartHours = Math.floor(totalMinutes / 60);
    const slotStartMins = totalMinutes % 60;

    return `${this.padZero(slotStartHours)}:${this.padZero(slotStartMins)}`;
  }

  getTimeSlotForIndex(plannedDay: PlannedDayResponse, slotIndex: number): TimeSlotUI | null {
    const slots = this.slotCache.get(plannedDay.id);
    return slots?.[slotIndex] ?? null;
  }

  getTimeSlotUIData(plannedDay: PlannedDayResponse): TimeSlotUI[] {
    if (!plannedDay.startTime) {
      return [];
    }

    const slotMap = new Map<number, TimeSlotUI>();
    const [startHours, startMinutes] = plannedDay.startTime.split(':').map(Number);

    for (let i = 1; i <= plannedDay.numberOfTimeSlots; i++) {
      const minutesFromStart = (i - 1) * this.slotDurationMinutes;
      const totalMinutes = startHours * 60 + startMinutes + minutesFromStart;

      const slotStartHours = Math.floor(totalMinutes / 60);
      const slotStartMins = totalMinutes % 60;

      const slotEndMinutes = totalMinutes + this.slotDurationMinutes;
      const slotEndHours = Math.floor(slotEndMinutes / 60);
      const slotEndMins = slotEndMinutes % 60;

      const start = `${this.padZero(slotStartHours)}:${this.padZero(slotStartMins)}`;
      const end = `${this.padZero(slotEndHours)}:${this.padZero(slotEndMins)}`;

      slotMap.set(i, {
        number: i,
        startTime: start,
        endTime: end,
        isAvailable: true,
        isBooked: false,
        bookState: undefined
      });
    }

    plannedDay.timeSlots.filter(ts => ts.weekNumber === this.weekNumber).forEach(timeSlot => {
      const existing = slotMap.get(timeSlot.timeSlotNumber);
      if (existing) {
        existing.isAvailable = false;
        existing.isBooked = true;
        existing.bookState = timeSlot.bookState;
      }
    });

    return Array.from(slotMap.values());
  }

  getBookStateName(bookState: string | undefined): string {
    if (!bookState) return 'Booked';
    const stateNames: Record<string, string> = {
      'BookInProgress': 'In Progress',
      'Booked': 'Booked',
      'Paid': 'Paid',
      'Plaid': 'Plaid'
    };
    return stateNames[bookState] || bookState;
  }

  private padZero(num: number): string {
    return num.toString().padStart(2, '0');
  }
}

