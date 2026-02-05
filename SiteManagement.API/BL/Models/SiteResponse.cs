namespace SiteManagement.API.BL.Models;

public record SiteResponse(
    Guid Id,
    string Name,
    IReadOnlyCollection<DateOnly> ClosedDays,
    IReadOnlyCollection<CourtResponse> Courts,
    IReadOnlyCollection<PlannedDayResponse> Schedule
);
