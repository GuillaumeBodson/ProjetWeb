import {Booking, Court} from '../../site-details/components/types/court';

export interface Site {
  id: number;
  name: string;
  openingHours: string;
  closingHours: string;
  closedDays: string[];
  courts: Court[];
  revenue: number;
  bookings: Booking[];
}

export type SiteDto = Site;
