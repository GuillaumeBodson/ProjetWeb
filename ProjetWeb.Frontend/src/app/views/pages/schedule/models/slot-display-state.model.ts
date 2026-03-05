import { BookState } from '../../../../core/api/site';

/**
 * Frontend-specific enum for displaying slot states in the UI.
 * Extends the backend BookState with an "Available" state for slots without bookings.
 *
 * This enum is used for:
 * - UI display logic
 * - CSS class binding
 * - User-facing labels
 *
 * Note: "Available" is not a backend state - it represents the absence of a bookState.
 */
export enum SlotDisplayState {
  Available = 'Available',
  BookInProgress = 'BookInProgress',
  Booked = 'Booked',
  Paid = 'Paid',
  Played = 'Played'
}

/**
 * Maps backend BookState to frontend SlotDisplayState.
 * Handles the case where bookState is undefined (meaning available).
 *
 * @param bookState - The backend BookState or undefined
 * @returns The corresponding SlotDisplayState
 */
export function mapToSlotDisplayState(bookState: BookState | undefined | null): SlotDisplayState {
  if (!bookState) {
    return SlotDisplayState.Available;
  }

  // Map backend states to frontend states (1:1 mapping for existing states)
  switch (bookState) {
    case BookState.BookInProgress:
      return SlotDisplayState.BookInProgress;
    case BookState.Booked:
      return SlotDisplayState.Booked;
    case BookState.Paid:
      return SlotDisplayState.Paid;
    case BookState.Played:
      return SlotDisplayState.Played;
    default:
      // Fallback for unknown states
      return SlotDisplayState.Available;
  }
}

/**
 * Get user-friendly display name for a slot state.
 *
 * @param state - The SlotDisplayState
 * @returns Human-readable label
 */
export function getSlotDisplayStateName(state: SlotDisplayState): string {
  const stateNames: Record<SlotDisplayState, string> = {
    [SlotDisplayState.Available]: 'Available',
    [SlotDisplayState.BookInProgress]: 'In Progress',
    [SlotDisplayState.Booked]: 'Booked',
    [SlotDisplayState.Paid]: 'Paid',
    [SlotDisplayState.Played]: 'Played'
  };
  return stateNames[state];
}


