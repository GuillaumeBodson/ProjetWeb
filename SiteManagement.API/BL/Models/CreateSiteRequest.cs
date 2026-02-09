using System.ComponentModel.DataAnnotations;

namespace SiteManagement.API.BL.Models;

public record CreateSiteRequest(
    string Name,
    IReadOnlyCollection<DateTime>? ClosedDays,
    IReadOnlyCollection<CreateCourtRequest>? Courts,
    IReadOnlyCollection<CreatePlannedDayRequest> Schedule
)
{
};
