namespace SiteManagement.API.BL.Models;

public record SiteResponse(
    Guid Id,
    string Name,
    decimal Revenue,
    IReadOnlyCollection<DateOnly> ClosedDays,
    int CourtsCount
);