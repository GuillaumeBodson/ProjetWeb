import { SlotDisplayState } from './slot-display-state.model';

/**
 * UI representation of a consolidated time slot with computed display properties.
 * One entry represents a single row in the schedule table (all courts merged).
 */
export interface TimeSlotUI {
  number: number;
  startTime: string;
  endTime: string;
  /** Available if at least one court is free, otherwise reflects the dominant booked state. */
  displayState: SlotDisplayState;
  /** Number of courts available for this slot. */
  availableCourtCount: number;
  /** Total number of courts for this slot. */
  totalCourtCount: number;
}

