namespace SiteManagement.API.BL.Models;

public record PlannedDayResponse(
    Guid Id,
    DayOfWeek DayOfWeek,
    int NumberOfTimeSlots,
    IReadOnlyCollection<TimeSlotResponse> TimeSlots
);
