using System.ComponentModel.DataAnnotations;

namespace SiteManagement.API.BL.Models;

public record CreateSiteRequest(
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
    // Custom validation to ensure all 7 days of week are present
    public bool HasAllDaysOfWeek()
    {
        if (Schedule.Count != 7) return false;

        var distinctDays = Schedule.Select(s => s.DayOfWeek).Distinct().Count();
        return distinctDays == 7;
    }
};
