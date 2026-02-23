import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy, signal, computed, SimpleChanges, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { PlannedDayResponse } from '../../../../../core/api/site';
import { ScheduleTableComponent, ScheduleTableClassMap } from '../schedule-table/schedule-table.component';

const SLOT_DURATION_MINUTES = 105;

@Component({
  selector: 'app-weekly-planner',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule, ScheduleTableComponent],
  templateUrl: './weekly-planner.component.html',
  styleUrl: './weekly-planner.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class WeeklyPlannerComponent implements OnChanges {
  @Input() plannedDays: PlannedDayResponse[] = [];
  @Input() weekNumber: number = 1;
  @Input() canGoToPreviousWeek: boolean = false;
  @Input() canGoToNextWeek: boolean = false;

  @Output() previousWeek = new EventEmitter<void>();
  @Output() nextWeek = new EventEmitter<void>();

  readonly slotDurationMinutes = SLOT_DURATION_MINUTES;

  readonly desktopClassMap: ScheduleTableClassMap = {
    table: 'schedule-table w-full border-collapse',
    headerRow: 'header-row',
    timeHeader: 'time-header',
    dayHeader: 'day-header',
    dayName: 'day-name',
    slotRow: 'slot-row',
    timeCell: 'time-cell',
    timeLabel: 'time-label',
    slotCell: 'slot-cell',
    slotButton: 'slot-button w-full'
  };

  readonly mobileClassMap: ScheduleTableClassMap = {
    table: 'mobile-schedule-table w-full border-collapse',
    headerRow: 'header-row',
    timeHeader: 'time-header-mobile',
    dayHeader: 'day-header-mobile',
    dayName: 'day-name-mobile text-xs',
    slotRow: 'slot-row-mobile',
    timeCell: 'time-cell-mobile',
    timeLabel: 'time-label-mobile text-xs',
    slotCell: 'slot-cell-mobile',
    slotButton: 'slot-button-mobile w-full'
  };

  // Signals for mobile day navigation
  currentDayPairIndex = signal<number>(0);

  // Mobile 2-day pair navigation
  canGoToPreviousDayPair = computed(() => this.currentDayPairIndex() > 0);
  canGoToNextDayPair = computed(() => {
    const maxPairs = Math.ceil(this.plannedDays.length / 2);
    return this.currentDayPairIndex() < maxPairs - 1;
  });

  /**
   * Handle input changes - reset day index when planned days change
   */
  ngOnChanges(changes: SimpleChanges): void {
    if (changes['plannedDays'] && !changes['plannedDays'].firstChange) {
      this.currentDayPairIndex.set(0);
    }
  }

  /**
   * Navigate to the previous day pair (mobile 2-day view)
   */
  goToPreviousDayPair(): void {
    if (this.canGoToPreviousDayPair()) {
      this.currentDayPairIndex.update(index => index - 1);
    }
  }

  /**
   * Navigate to the next day pair (mobile 2-day view)
   */
  goToNextDayPair(): void {
    if (this.canGoToNextDayPair()) {
      this.currentDayPairIndex.update(index => index + 1);
    }
  }

  /**
   * Get the current pair of days for mobile view (2 days at a time)
   */
  getCurrentDayPair(): PlannedDayResponse[] {
    const startIndex = this.currentDayPairIndex() * 2;
    return this.plannedDays.slice(startIndex, startIndex + 2);
  }

  /**
   * Emit event to go to previous week (mobile view)
   */
  onPreviousWeek(): void {
    this.previousWeek.emit();
  }

  /**
   * Emit event to go to next week (mobile view)
   */
  onNextWeek(): void {
    this.nextWeek.emit();
  }

  /**
   * Get array of slot indices for table rows (based on max slots across all days)
   */
  getSlotIndices(): number[] {
    if (this.plannedDays.length === 0) return [];
    const maxSlots = Math.max(...this.plannedDays.map(d => d.numberOfTimeSlots));
    return Array.from({ length: maxSlots }, (_, i) => i);
  }

  getMobileSlotIndices(): number[] {
    const dayPair = this.getCurrentDayPair();
    if (dayPair.length === 0) return [];
    const maxSlots = Math.max(...dayPair.map(d => d.numberOfTimeSlots));
    return Array.from({ length: maxSlots }, (_, i) => i);
  }
}
