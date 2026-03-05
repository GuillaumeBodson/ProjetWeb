import { TimeSlotResponse } from '../../../../core/api/site';

/**
 * Represents a day's schedule with all time slots for that day.
 * This is the primary data structure used throughout the schedule feature.
 */
export interface DaySchedule {
  date: Date;
  dayName: string;
  slots: TimeSlotResponse[];
}

