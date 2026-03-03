namespace SiteManagement.API.DAL.Entities;

public class TimeSlotHistory
{
    public Guid Id { get; set; }
    public Guid PlannedDayId { get; set; }
    public Guid CourtId { get; set; }
    public int TimeSlotNumber { get; set; }
    public BookState FinalBookState { get; set; }
    public int WeekNumber { get; set; }
    public int Year { get; set; }
    public DateTime StartDateTime { get; set; }
    public DateTime ArchivedAt { get; set; }
}
