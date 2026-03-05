import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy, signal, computed, SimpleChanges, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { ScheduleTableComponent } from '../schedule-table/schedule-table.component';
import { DaySchedule } from '../../models';

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
  @Input() daySchedules: DaySchedule[] = [];
  @Input() weekNumber: number = 1;
  @Input() canGoToPreviousWeek: boolean = false;
  @Input() canGoToNextWeek: boolean = false;

  @Output() previousWeek = new EventEmitter<void>();
  @Output() nextWeek = new EventEmitter<void>();

  readonly slotDurationMinutes = SLOT_DURATION_MINUTES;


  // Signals for mobile day navigation
  currentDayPairIndex = signal<number>(0);

  // Mobile 2-day pair navigation
  canGoToPreviousDayPair = computed(() => this.currentDayPairIndex() > 0);
  canGoToNextDayPair = computed(() => {
    const maxPairs = Math.ceil(this.daySchedules.length / 2);
    return this.currentDayPairIndex() < maxPairs - 1;
  });

  /**
   * Handle input changes - reset day index when day schedules or week number change
   */
  ngOnChanges(changes: SimpleChanges): void {
    if (changes['daySchedules'] || changes['weekNumber']) {
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
  getCurrentDayPair(): DaySchedule[] {
    const startIndex = this.currentDayPairIndex() * 2;
    return this.daySchedules.slice(startIndex, startIndex + 2);
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
   * Get array of slot indices for table rows
   */
  getSlotIndices(): number[] {
    if (this.daySchedules.length === 0) return [];
    const maxSlots = Math.max(...this.daySchedules.map(d => d.slots.length));
    return Array.from({ length: maxSlots }, (_, i) => i);
  }

  getMobileSlotIndices(): number[] {
    const dayPair = this.getCurrentDayPair();
    if (dayPair.length === 0) return [];
    const maxSlots = Math.max(...dayPair.map(d => d.slots.length));
    return Array.from({ length: maxSlots }, (_, i) => i);
  }
}
