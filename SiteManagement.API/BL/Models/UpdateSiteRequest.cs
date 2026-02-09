using System.ComponentModel.DataAnnotations;

namespace SiteManagement.API.BL.Models;

public record UpdateSiteRequest(
    string Name,
    IReadOnlyCollection<DateTime>? ClosedDays,
    IReadOnlyCollection<CreateCourtRequest>? Courts
)
{ }
