using Booking.API.DAL.Entities;

namespace Booking.API.BL.Models;

public record BookingResponse
{
    public required Guid Id { get; init; }
    public required Guid CreatorId { get; init; }
    public required Guid SiteId { get; init; }
    public required Guid CourtId { get; init; }
    public required Guid TimeSlotId { get; init; }
    public required DateTime BookingDate { get; init; }
    public required BookingStatus Status { get; init; }
    public required DateTime CreatedAt { get; init; }
    public DateTime? CancelledAt { get; init; }
}
