namespace SiteManagement.API.BL.Models;


public record SiteDetailsResponse(
    Guid Id,
    string Name,
    decimal Revenue,
    IReadOnlyCollection<DateOnly> ClosedDays,
    IReadOnlyCollection<CourtResponse> Courts,
    IReadOnlyCollection<PlannedDayResponse> Schedule
);

