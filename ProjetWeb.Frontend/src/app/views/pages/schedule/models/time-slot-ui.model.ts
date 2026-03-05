import { SlotDisplayState } from './slot-display-state.model';

/**
 * UI representation of a time slot with computed display properties.
 * Used for rendering time slots in the schedule table.
 */
export interface TimeSlotUI {
  number: number;
  startTime: string;
  endTime: string;
  displayState: SlotDisplayState;
}

