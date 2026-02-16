using Booking.API.BL.Models;
using BookingEntity = Booking.API.DAL.Entities.Booking;

namespace Booking.API.BL.Mappers;

public static class BookingMapper
{
    public static BookingResponse ToResponse(this BookingEntity booking)
    {
        return new BookingResponse
        {
            Id = booking.Id,
            CreatorId = booking.CreatorId,
            SiteId = booking.SiteId,
            CourtId = booking.CourtId,
            TimeSlotId = booking.TimeSlotId,
            BookingDate = booking.BookingDate,
            Status = booking.Status,
            CreatedAt = booking.CreatedAt,
            CancelledAt = booking.CancelledAt
        };
    }
}
