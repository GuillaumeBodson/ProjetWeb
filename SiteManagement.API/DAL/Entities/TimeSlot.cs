namespace SiteManagement.API.DAL.Entities;

public class TimeSlot
{
    public Guid Id { get; set; }
    public Guid PlannedDayId { get; set; }
    public Guid CourtId { get; set; }
    public int TimeSlotNumber { get; set; }
    public BookState BookState { get; set; }
    public int WeekNumber { get; set; }

    // Navigation properties
    public PlannedDay PlannedDay { get; set; } = null!;
    public Court Court { get; set; } = null!;
}