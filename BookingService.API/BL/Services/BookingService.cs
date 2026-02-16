using Booking.API.BL.Mappers;
using Booking.API.BL.Models;
using Booking.API.BL.Services.Abstractions;
using Booking.API.DAL;
using Booking.API.DAL.Entities;
using Microsoft.EntityFrameworkCore;
using BookingEntity = Booking.API.DAL.Entities.Booking;

namespace Booking.API.BL.Services;

public class BookingService(
    BookingDbContext context,
    ILogger<BookingService> logger) : IBookingService
{
    public async Task<BookingResponse> CreateBookingAsync(
        Guid userId,
        CreateBookingRequest request,
        CancellationToken cancellationToken = default)
    {
        logger.LogInformation("Creating booking for user {UserId} at site {SiteId}, court {CourtId}, timeslot {TimeSlotId}",
            userId, request.SiteId, request.CourtId, request.TimeSlotId);

        // TODO: Validate that the time slot exists and is available (call SiteManagement API)
        // TODO: Get the price from the time slot

        var booking = new BookingEntity
        {
            CreatorId = userId,
            SiteId = request.SiteId,
            CourtId = request.CourtId,
            TimeSlotId = request.TimeSlotId,
            BookingDate = request.BookingDate,
            Status = BookingStatus.Confirmed,
            CreatedAt = DateTime.UtcNow
        };

        context.Bookings.Add(booking);
        await context.SaveChangesAsync(cancellationToken);

        logger.LogInformation("Booking {BookingId} created successfully", booking.Id);

        return booking.ToResponse();
    }

    public async Task<BookingResponse?> GetBookingByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var booking = await context.Bookings
            .FirstOrDefaultAsync(b => b.Id == id, cancellationToken);

        return booking?.ToResponse();
    }

    public async Task<IEnumerable<BookingResponse>> GetUserBookingsAsync(
        Guid userId,
        CancellationToken cancellationToken = default)
    {
        var bookings = await context.Bookings
            .Where(b => b.CreatorId == userId)
            .OrderByDescending(b => b.CreatedAt)
            .ToListAsync(cancellationToken);

        return bookings.Select(b => b.ToResponse());
    }

    public async Task<IEnumerable<BookingResponse>> GetBookingsBySiteAsync(
        Guid siteId,
        CancellationToken cancellationToken = default)
    {
        var bookings = await context.Bookings
            .Where(b => b.SiteId == siteId)
            .OrderByDescending(b => b.CreatedAt)
            .ToListAsync(cancellationToken);

        return bookings.Select(b => b.ToResponse());
    }

    public async Task<IEnumerable<BookingResponse>> GetBookingsByCourtAsync(
        Guid courtId,
        CancellationToken cancellationToken = default)
    {
        var bookings = await context.Bookings
            .Where(b => b.CourtId == courtId)
            .OrderByDescending(b => b.CreatedAt)
            .ToListAsync(cancellationToken);

        return bookings.Select(b => b.ToResponse());
    }

    public async Task<IEnumerable<BookingResponse>> GetBookingsByTimeSlotAsync(
        Guid timeSlotId,
        CancellationToken cancellationToken = default)
    {
        var bookings = await context.Bookings
            .Where(b => b.TimeSlotId == timeSlotId)
            .OrderByDescending(b => b.CreatedAt)
            .ToListAsync(cancellationToken);

        return bookings.Select(b => b.ToResponse());
    }

    public async Task<BookingResponse> CancelBookingAsync(
        Guid id,
        Guid userId,
        CancellationToken cancellationToken = default)
    {
        var booking = await context.Bookings
            .FirstOrDefaultAsync(b => b.Id == id, cancellationToken);

        if (booking is null)
        {
            throw new KeyNotFoundException($"Booking with ID {id} not found.");
        }

        if (booking.CreatorId != userId)
        {
            throw new UnauthorizedAccessException("You are not authorized to cancel this booking.");
        }

        if (booking.Status == BookingStatus.Cancelled)
        {
            throw new InvalidOperationException("Booking is already cancelled.");
        }

        booking.Status = BookingStatus.Cancelled;
        booking.CancelledAt = DateTime.UtcNow;

        await context.SaveChangesAsync(cancellationToken);

        logger.LogInformation("Booking {BookingId} cancelled by user {UserId}", id, userId);

        return booking.ToResponse();
    }
}
