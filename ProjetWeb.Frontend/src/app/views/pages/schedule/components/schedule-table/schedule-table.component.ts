import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { format } from 'date-fns';
import {
  DaySchedule,
  ConsolidatedTimeSlot,
  TimeSlotUI,
  SlotDisplayState,
  getSlotDisplayStateName
} from '../../models';
import { BookState } from '../../../../../core/api/site';

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
      this.slotCache.set(dateKey, this.buildTimeSlotUIList(day));
    }
  }

  getTimeForSlotIndex(day: DaySchedule, slotIndex: number): string {
    if (!day.slots || day.slots.length === 0) return '';
    const slot = day.slots[slotIndex];
    if (!slot) return '';
    return format(new Date(slot.dateTime), 'HH:mm');
  }

  getTimeSlotForIndex(day: DaySchedule, slotIndex: number): TimeSlotUI | null {
    const dateKey = format(day.date, 'yyyy-MM-dd');
    const slots = this.slotCache.get(dateKey);
    return slots?.[slotIndex] ?? null;
  }

  getDateKey(day: DaySchedule): string {
    return format(day.date, 'yyyy-MM-dd');
  }

  /**
   * Build the UI slot list for a single day from its consolidated slots.
   * One TimeSlotUI is produced per ConsolidatedTimeSlot (i.e. per unique slot number).
   * The displayState is Available when at least one court is free.
   */
  private buildTimeSlotUIList(day: DaySchedule): TimeSlotUI[] {
    if (!day.slots || day.slots.length === 0) {
      return [];
    }

    return day.slots.map((slot: ConsolidatedTimeSlot, index: number) => {
      const startDate = new Date(slot.dateTime);
      const endDate = new Date(startDate.getTime() + this.slotDurationMinutes * 60000);

      const isAvailable = slot.availableCourtCount > 0;
      const displayState = isAvailable
        ? SlotDisplayState.Available
        : this.dominantBookedState(slot);

      return {
        number: index + 1,
        startTime: format(startDate, 'HH:mm'),
        endTime: format(endDate, 'HH:mm'),
        displayState,
        availableCourtCount: slot.availableCourtCount,
        totalCourtCount: slot.totalCourtCount
      };
    });
  }

  /**
   * Return the most "advanced" booked state among all courts for display purposes.
   * Priority: Played > Paid > Booked > BookInProgress
   */
  private dominantBookedState(slot: ConsolidatedTimeSlot): SlotDisplayState {
    const priority: Record<BookState, number> = {
      [BookState.Played]: 4,
      [BookState.Paid]: 3,
      [BookState.Booked]: 2,
      [BookState.BookInProgress]: 1
    };

    let dominant = SlotDisplayState.BookInProgress;
    let maxPriority = 0;

    for (const courtSlot of slot.courtSlots) {
      if (courtSlot.bookState) {
        const p = priority[courtSlot.bookState] ?? 0;
        if (p > maxPriority) {
          maxPriority = p;
          switch (courtSlot.bookState) {
            case BookState.Played: dominant = SlotDisplayState.Played; break;
            case BookState.Paid: dominant = SlotDisplayState.Paid; break;
            case BookState.Booked: dominant = SlotDisplayState.Booked; break;
            default: dominant = SlotDisplayState.BookInProgress;
          }
        }
      }
    }
    return dominant;
  }

  protected readonly SlotDisplayState = SlotDisplayState;
  protected readonly getSlotDisplayStateName = getSlotDisplayStateName;
}

