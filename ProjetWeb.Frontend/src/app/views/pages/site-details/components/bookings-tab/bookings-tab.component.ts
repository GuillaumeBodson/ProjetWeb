import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { DatePipe, NgClass, NgForOf, NgIf } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { CourtResponse } from '../../../../../core/api/site';

export interface TimeSlotBooking {
  id: string;
  courtId: string;
  timeSlotNumber: number;
  weekNumber: number;
  bookState: string;
  dateTime: string;
}

@Component({
  selector: 'app-bookings-tab',
  standalone: true,
  imports: [
    NgIf,
    NgForOf,
    NgClass,
    DatePipe,
    MatCardModule,
    MatIconModule,
  ],
  templateUrl: './bookings-tab.component.html',
  styleUrl: './bookings-tab.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BookingsTabComponent {
  // Inputs
  readonly bookings = input.required<TimeSlotBooking[]>();
  readonly courts = input.required<CourtResponse[]>();

  getCourtNumber(courtId: string): number | undefined {
    return this.courts().find(c => c.id === courtId)?.number;
  }

  formatTime(dateTime: string): string {
    const date = new Date(dateTime);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
  }

  getBookStateColor(state: string): string {
    switch (state) {
      case 'Available':
        return 'bg-green-100 text-green-800';
      case 'Booked':
        return 'bg-red-100 text-red-800';
      case 'Unavailable':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-blue-100 text-blue-800';
    }
  }
}

