using Booking.API.BL.Models;
using Booking.API.BL.Services.Abstractions;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace Booking.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class BookingsController(IBookingService bookingService) : ControllerBase
{
    private Guid UserId => Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)
        ?? throw new UnauthorizedAccessException("User ID not found in claims."));

    /// <summary>
    /// Create a new booking
    /// </summary>
    [HttpPost("{userId:Guid}")]
    [ProducesResponseType<BookingResponse>(StatusCodes.Status201Created)]
    public async Task<IActionResult> CreateBooking(Guid userId, [FromBody] CreateBookingRequest request, CancellationToken cancellationToken)
    {
        var booking = await bookingService.CreateBookingAsync(userId, request, cancellationToken);
        return CreatedAtAction(nameof(GetBooking), new { id = booking.Id }, booking);
    }

    /// <summary>
    /// Get a booking by ID
    /// </summary>
    [HttpGet("{id:Guid}")]
    [ProducesResponseType<BookingResponse>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetBooking(Guid id, CancellationToken cancellationToken)
    {
        var booking = await bookingService.GetBookingByIdAsync(id, cancellationToken);
        
        if (booking is null)
        {
            return NotFound();
        }

        return Ok(booking);
    }

    /// <summary>
    /// Get all bookings for the current user
    /// </summary>
    [HttpGet("my")]
    [ProducesResponseType<IEnumerable<BookingResponse>>(StatusCodes.Status200OK)]
    public async Task<IActionResult> GetMyBookings(CancellationToken cancellationToken)
    {
        var bookings = await bookingService.GetUserBookingsAsync(UserId, cancellationToken);
        return Ok(bookings);
    }

    /// <summary>
    /// Get all bookings for a specific site
    /// </summary>
    [HttpGet("site/{siteId:Guid}")]
    [ProducesResponseType<IEnumerable<BookingResponse>>(StatusCodes.Status200OK)]
    public async Task<IActionResult> GetBookingsBySite(Guid siteId, CancellationToken cancellationToken)
    {
        var bookings = await bookingService.GetBookingsBySiteAsync(siteId, cancellationToken);
        return Ok(bookings);
    }

    /// <summary>
    /// Get all bookings for a specific court
    /// </summary>
    [HttpGet("court/{courtId:Guid}")]
    [ProducesResponseType<IEnumerable<BookingResponse>>(StatusCodes.Status200OK)]
    public async Task<IActionResult> GetBookingsByCourt(Guid courtId, CancellationToken cancellationToken)
    {
        var bookings = await bookingService.GetBookingsByCourtAsync(courtId, cancellationToken);
        return Ok(bookings);
    }

    /// <summary>
    /// Get all bookings for a specific time slot
    /// </summary>
    [HttpGet("timeslot/{timeSlotId:Guid}")]
    [ProducesResponseType<IEnumerable<BookingResponse>>(StatusCodes.Status200OK)]
    public async Task<IActionResult> GetBookingsByTimeSlot(Guid timeSlotId, CancellationToken cancellationToken)
    {
        var bookings = await bookingService.GetBookingsByTimeSlotAsync(timeSlotId, cancellationToken);
        return Ok(bookings);
    }

    /// <summary>
    /// Cancel a booking
    /// </summary>
    [HttpPost("{id:Guid}/cancel")]
    [ProducesResponseType<BookingResponse>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> CancelBooking(Guid id, CancellationToken cancellationToken)
    {
        var booking = await bookingService.CancelBookingAsync(id, UserId, cancellationToken);
        return Ok(booking);
    }
}
