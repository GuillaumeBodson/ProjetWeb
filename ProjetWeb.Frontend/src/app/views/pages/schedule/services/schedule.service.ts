import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { SiteFacadeService } from '../../../../core/services/site-facade.service';
import { TimeSlotResponse, PlannedDayResponse } from '../../../../core/api/site';
import { SiteResponse, SiteDetailsResponse } from '../../../../core/api/site/model/model-override';

/**
 * Service for managing schedule-related operations.
 * Handles fetching sites and filtering time slot data.
 */
@Injectable({
  providedIn: 'root'
})
export class ScheduleService {
  private readonly siteFacadeService = inject(SiteFacadeService);

  /**
   * Get all sites for dropdown selection.
   * @returns Observable of all sites
   */
  getAllSites(): Observable<SiteResponse[]> {
    return this.siteFacadeService.getAllSites();
  }

  /**
   * Get site details with its schedule.
   * @param siteId - The ID of the site
   * @returns Observable of site details including schedule
   */
  getSiteWithSchedule(siteId: string): Observable<SiteDetailsResponse> {
    return this.siteFacadeService.getSiteById(siteId);
  }

  /**
   * Get available time slots for a specific court on a planned day.
   * @param plannedDay - The planned day with all time slots
   * @param courtId - The ID of the court
   * @returns Array of available time slot numbers
   */
  getAvailableTimeSlots(plannedDay: PlannedDayResponse, courtId: string): number[] {
    const bookedSlots = plannedDay.timeSlots
      .filter(ts => ts.courtId === courtId)
      .map(ts => ts.timeSlotNumber);

    const allSlots = Array.from({ length: plannedDay.numberOfTimeSlots }, (_, i) => i + 1);
    return allSlots.filter(slot => !bookedSlots.includes(slot));
  }

  /**
   * Get booked time slots for a specific court on a planned day.
   * @param plannedDay - The planned day with all time slots
   * @param courtId - The ID of the court
   * @returns Array of booked time slots
   */
  getBookedTimeSlots(plannedDay: PlannedDayResponse, courtId: string): TimeSlotResponse[] {
    return plannedDay.timeSlots.filter(ts => ts.courtId === courtId);
  }
}

