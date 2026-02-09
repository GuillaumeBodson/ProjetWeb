namespace SiteManagement.API.BL.Models;

public record UpdateScheduleRequest(
    Guid SiteId,
    IEnumerable<CreatePlannedDayRequest> PlannedDays
    )
{
}
