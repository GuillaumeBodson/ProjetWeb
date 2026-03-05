import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { format } from 'date-fns';
import {
  DaySchedule,
  TimeSlotUI,
  SlotDisplayState,
  mapToSlotDisplayState,
  getSlotDisplayStateName
} from '../../models';

@Component({
  selector: 'app-schedule-table',
  standalone: true,
  imports: [CommonModule, MatButtonModule],
  templateUrl: './schedule-table.component.html',
  styleUrl: './schedule-table.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ScheduleTableComponent implements OnChanges {
  @Input() days: DaySchedule[] = [];
  @Input() slotIndices: number[] = [];
  @Input() slotDurationMinutes = 105;
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
      const dateKey = format(day.date, 'yyyy-MM-dd');
      this.slotCache.set(dateKey, this.getTimeSlotUIData(day));
    }
  }

  getTimeForSlotIndex(day: DaySchedule, slotIndex: number): string {
    if (!day.slots || day.slots.length === 0) return '';

    const slot = day.slots[slotIndex];
    if (!slot) return '';

    const date = new Date(slot.dateTime);
    return format(date, 'HH:mm');
  }

  getTimeSlotForIndex(day: DaySchedule, slotIndex: number): TimeSlotUI | null {
    const dateKey = format(day.date, 'yyyy-MM-dd');
    const slots = this.slotCache.get(dateKey);
    return slots?.[slotIndex] ?? null;
  }

  getTimeSlotUIData(day: DaySchedule): TimeSlotUI[] {
    if (!day.slots || day.slots.length === 0) {
      return [];
    }

    // Sort slots by datetime
    const sortedSlots = [...day.slots].sort((a, b) =>
      new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime()
    );

    // Transform each slot into TimeSlotUI
    return sortedSlots.map((slot, index) => {
      const startDate = new Date(slot.dateTime);
      const endDate = new Date(startDate.getTime() + this.slotDurationMinutes * 60000);

      return {
        number: index + 1,
        startTime: format(startDate, 'HH:mm'),
        endTime: format(endDate, 'HH:mm'),
        displayState: mapToSlotDisplayState(slot.bookState)
      };
    });
  }

  getDateKey(day: DaySchedule): string {
    return format(day.date, 'yyyy-MM-dd');
  }

  protected readonly getSlotDisplayStateName = getSlotDisplayStateName;
}

