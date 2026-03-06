import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { SiteFacadeService } from '../../../../core/services/site-facade.service';
import { TimeSlotResponse } from '../../../../core/api/site';
import { SiteResponse } from '../../../../core/api/site/model/model-override';
import { format } from 'date-fns';
import { ConsolidatedTimeSlot, DaySchedule } from '../models';

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
   * Get schedule organised by day for a specific site and week.
   * Multiple courts for the same slot number are consolidated into a single row.
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
   * Transform flat TimeSlotResponse array into day-based structure with consolidated slots.
   * Slots sharing the same date and timeSlotNumber (i.e. different courts) are merged
   * into a single ConsolidatedTimeSlot.  A merged slot is Available when at least one
   * of its court slots has no booking (bookState is absent / falsy).
   *
   * @param timeSlots - Array of time slot responses
   * @returns Array of day schedules sorted by date
   */
  private transformToDaySchedules(timeSlots: TimeSlotResponse[]): DaySchedule[] {
    if (!timeSlots || timeSlots.length === 0) {
      return [];
    }

    // ── Group raw slots by calendar date ──────────────────────────────────────
    const slotsByDate = new Map<string, TimeSlotResponse[]>();

    for (const slot of timeSlots) {
      const dateKey = format(new Date(slot.dateTime), 'yyyy-MM-dd');
      if (!slotsByDate.has(dateKey)) {
        slotsByDate.set(dateKey, []);
      }
      slotsByDate.get(dateKey)!.push(slot);
    }

    // ── For each day, consolidate per timeSlotNumber ──────────────────────────
    return Array.from(slotsByDate.entries())
      .map(([, daySlots]) => {
        const date = new Date(daySlots[0].dateTime);

        // Group by timeSlotNumber
        const bySlotNumber = new Map<number, TimeSlotResponse[]>();
        for (const slot of daySlots) {
          if (!bySlotNumber.has(slot.timeSlotNumber)) {
            bySlotNumber.set(slot.timeSlotNumber, []);
          }
          bySlotNumber.get(slot.timeSlotNumber)!.push(slot);
        }

        const consolidated: ConsolidatedTimeSlot[] = Array.from(bySlotNumber.entries())
          .map(([slotNumber, courtSlots]) => {
            const availableCourtCount = courtSlots.filter(s => !s.bookState).length;
            return {
              timeSlotNumber: slotNumber,
              dateTime: courtSlots[0].dateTime,
              availableCourtCount,
              totalCourtCount: courtSlots.length,
              courtSlots
            };
          })
          .sort((a, b) => a.timeSlotNumber - b.timeSlotNumber);

        return {
          date,
          dayName: format(date, 'EEEE'),
          slots: consolidated
        };
      })
      .sort((a, b) => a.date.getTime() - b.date.getTime());
  }
}

