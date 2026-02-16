using Booking.API.BL.Models;

namespace Booking.API.BL.Services.Abstractions;

public interface IBookingService
{
    Task<BookingResponse> CreateBookingAsync(Guid userId, CreateBookingRequest request, CancellationToken cancellationToken = default);
    Task<BookingResponse?> GetBookingByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<IEnumerable<BookingResponse>> GetUserBookingsAsync(Guid userId, CancellationToken cancellationToken = default);
    Task<IEnumerable<BookingResponse>> GetBookingsBySiteAsync(Guid siteId, CancellationToken cancellationToken = default);
    Task<IEnumerable<BookingResponse>> GetBookingsByCourtAsync(Guid courtId, CancellationToken cancellationToken = default);
    Task<IEnumerable<BookingResponse>> GetBookingsByTimeSlotAsync(Guid timeSlotId, CancellationToken cancellationToken = default);
    Task<BookingResponse> CancelBookingAsync(Guid id, Guid userId, CancellationToken cancellationToken = default);
}
