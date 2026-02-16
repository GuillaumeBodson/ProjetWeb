namespace Booking.API.BL.Models;

public record CreateBookingRequest
{
    public required Guid SiteId { get; init; }
    public required Guid CourtId { get; init; }
    public required Guid TimeSlotId { get; init; }
    public required DateTime BookingDate { get; init; }
}
