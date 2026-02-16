namespace Booking.API.DAL.Entities;

public class Booking
{
    public Guid Id { get; set; }
    public Guid CreatorId { get; set; }
    public Guid SiteId { get; set; }
    public Guid CourtId { get; set; }
    public Guid TimeSlotId { get; set; }
    public DateTime BookingDate { get; set; }
    public BookingType BookingType { get; set; }
    public BookingStatus Status { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? CancelledAt { get; set; }
    public Guid? Participant2 { get; set; }
    public Guid? Participant3 { get; set; }
    public Guid? Participant4 { get; set; }
    public HashSet<Participant> Participants { get; set; } = [];
}

public enum BookingStatus
{
    Created,
    Confirmed,
    Cancelled,
    Completed
}

public enum BookingType
{
    Public,
    Private
}
