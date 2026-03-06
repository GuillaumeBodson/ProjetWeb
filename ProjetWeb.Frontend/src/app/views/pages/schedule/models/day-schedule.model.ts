import { TimeSlotResponse } from '../../../../core/api/site';

/**
 * A consolidated time slot that merges all courts for a given slot number/time.
 * A single row is shown in the schedule table regardless of how many courts exist.
 * The slot is considered available when at least one court is available.
 */
export interface ConsolidatedTimeSlot {
  /** ISO slot number shared by all courts at this time */
  timeSlotNumber: number;
  /** The datetime of this slot (same across courts) */
  dateTime: string;
  /** Number of courts that are available for this slot */
  availableCourtCount: number;
  /** Total number of courts for this slot */
  totalCourtCount: number;
  /** Raw per-court slots – kept for booking purposes */
  courtSlots: TimeSlotResponse[];
}

/**
 * Represents a day's schedule with consolidated time slots.
 * Each entry in `slots` represents one time-slot row (merged across all courts).
 */
export interface DaySchedule {
  date: Date;
  dayName: string;
  /** One entry per unique time slot number – courts are consolidated. */
  slots: ConsolidatedTimeSlot[];
}

