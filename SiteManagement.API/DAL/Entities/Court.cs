namespace SiteManagement.API.DAL.Entities;

public class Court
{
    public Guid Id { get; set; }
    public int Number { get; set; }
    public Guid SiteId { get; set; }

    // Navigation properties
    public Site Site { get; set; } = null!;
    public ICollection<TimeSlot> TimeSlots { get; set; } = [];
}
