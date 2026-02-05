namespace SiteManagement.API.DAL.Entities;

public class PlannedDay
{
    public Guid Id { get; set; }
    public Guid SiteId { get; set; }
    public DayOfWeek DayOfWeek { get; set; }
    public int NumberOfTimeSplots { get; set; }

    // Navigation properties
    public Site Site { get; set; } = null!;
    public ICollection<TimeSlot> TimeSlots { get; set; } = [];
}
