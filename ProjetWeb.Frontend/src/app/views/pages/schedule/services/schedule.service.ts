import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { SiteFacadeService } from '../../../../core/services/site-facade.service';
import { TimeSlotResponse } from '../../../../core/api/site';
import { SiteResponse } from '../../../../core/api/site/model/model-override';
import { format } from 'date-fns';
import { DaySchedule } from '../models';

/**
 * Service for managing schedule-related operations.
 * Handles fetching sites, time slot data, and transforming data for display.
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
   * Get schedule organized by day for a specific site and week.
   * @param siteId - The ID of the site
   * @param weekNumber - The ISO week number to fetch (optional)
   * @param numberOfWeeks - The number of weeks to fetch (optional, defaults to 1)
   * @returns Observable of day schedules sorted by date
   */
  getScheduleForWeek(siteId: string, weekNumber?: number, numberOfWeeks?: number): Observable<DaySchedule[]> {
    return this.siteFacadeService.getSiteSchedule(siteId, weekNumber, numberOfWeeks).pipe(
      map(timeSlots => this.transformToDaySchedules(timeSlots))
    );
  }

  /**
   * Transform flat TimeSlotResponse array into day-based structure.
   * @param timeSlots - Array of time slot responses
   * @returns Array of day schedules sorted by date
   */
  private transformToDaySchedules(timeSlots: TimeSlotResponse[]): DaySchedule[] {
    if (!timeSlots || timeSlots.length === 0) {
      return [];
    }

    // Group time slots by date
    const slotsByDate = new Map<string, TimeSlotResponse[]>();

    for (const slot of timeSlots) {
      const date = new Date(slot.dateTime);
      const dateKey = format(date, 'yyyy-MM-dd');

      if (!slotsByDate.has(dateKey)) {
        slotsByDate.set(dateKey, []);
      }
      slotsByDate.get(dateKey)!.push(slot);
    }

    // Convert to DaySchedule array and sort by date
    return Array.from(slotsByDate.entries())
      .map(([dateKey, slots]) => {
        const date = new Date(dateKey);
        return {
          date,
          dayName: format(date, 'EEEE'),
          slots: slots.sort((a, b) => new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime())
        };
      })
      .sort((a, b) => a.date.getTime() - b.date.getTime());
  }
}

