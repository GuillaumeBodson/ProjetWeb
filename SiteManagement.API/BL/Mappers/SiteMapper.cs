using SiteManagement.API.BL.Models;
using SiteManagement.API.DAL.Entities;

namespace SiteManagement.API.BL.Mappers;

public static class SiteMapper
{
    public static SiteResponse ToResponse(Site site)
    {
        var courtResponses = site.Courts
            .OrderBy(c => c.Number)
            .Select(c => new CourtResponse(c.Id, c.Number))
            .ToList();

        var schedule = site.PlannedDays
            .OrderBy(pd => pd.DayOfWeek)
            .Select(pd => new PlannedDayResponse(
                pd.Id,
                pd.DayOfWeek,
                pd.NumberOfTimeSlots,
                pd.TimeSlots
                    .OrderBy(ts => ts.TimeSlotNumber)
                    .ThenBy(ts => ts.WeekNumber)
                    .Select(ts => new TimeSlotResponse(
                        ts.Id,
                        ts.TimeSlotNumber,
                        ts.CourtId,
                        ts.WeekNumber,
                        ts.BookState))
                    .ToList()
            ))
            .ToList();

        return new SiteResponse(
            site.Id,
            site.Name,
            site.ClosedDays.OrderBy(d => d).ToList(),
            courtResponses,
            schedule
        );
    }
}