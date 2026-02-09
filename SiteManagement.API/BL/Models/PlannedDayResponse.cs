namespace SiteManagement.API.BL.Models;

public record PlannedDayResponse(
    Guid Id,
    DayOfWeek DayOfWeek,
    int NumberOfTimeSlots,
    TimeOnly StartTime,
    IReadOnlyCollection<TimeSlotResponse> TimeSlots
);
