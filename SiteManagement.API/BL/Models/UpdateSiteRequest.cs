using System.ComponentModel.DataAnnotations;

namespace SiteManagement.API.BL.Models;

public record UpdateSiteRequest(
    [Required]
    [StringLength(200, MinimumLength = 1)]
    string Name,

    IReadOnlyCollection<DateOnly>? ClosedDays,

    IReadOnlyCollection<CreateCourtRequest>? Courts,

    [Required]
    [MinLength(7, ErrorMessage = "Schedule must contain exactly 7 days (one for each day of the week)")]
    [MaxLength(7, ErrorMessage = "Schedule must contain exactly 7 days (one for each day of the week)")]
    IReadOnlyCollection<CreatePlannedDayRequest> Schedule
)
{

};
