namespace Booking.API.DAL.Entities;

public class Participant
{
    public Guid Id { get; set; }
    public Guid BookingId { get; set; }
    public Guid UserId { get; set; }
    public bool HasPaid { get; set; }
    public int Team { get; set; }
}
