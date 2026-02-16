using Booking.API.BL.Models;
using FluentValidation;

namespace Booking.API.BL.Models.Validators;

public class CreateBookingRequestValidator : AbstractValidator<CreateBookingRequest>
{
    public CreateBookingRequestValidator()
    {
        RuleFor(x => x.SiteId)
            .NotEmpty()
            .WithMessage("SiteId must not be empty.");

        RuleFor(x => x.CourtId)
            .NotEmpty()
            .WithMessage("CourtId must not be empty.");

        RuleFor(x => x.TimeSlotId)
            .NotEmpty()
            .WithMessage("TimeSlotId must not be empty.");

        RuleFor(x => x.BookingDate)
            .GreaterThanOrEqualTo(DateTime.UtcNow.Date)
            .WithMessage("BookingDate must be today or in the future.");
    }
}
