using FluentValidation;

namespace SiteManagement.API.BL.Models.Validators;

public class BookTimeSlotRequestValidator : AbstractValidator<BookTimeSlotRequest>
{
    public BookTimeSlotRequestValidator()
    {
        RuleFor(x => x.PlannedDayId)
            .NotEmpty()
            .WithMessage("PlannedDayId is required.");

        RuleFor(x => x.CourtId)
            .NotEmpty()
            .WithMessage("CourtId is required.");

        RuleFor(x => x.TimeSlotNumber)
            .GreaterThan(0)
            .LessThanOrEqualTo(100)
            .WithMessage("TimeSlotNumber must be between 1 and 100.");

        RuleFor(x => x.WeekNumber)
            .InclusiveBetween(1, 53)
            .WithMessage("WeekNumber must be between 1 and 53.");

        RuleFor(x => x.BookState)
            .IsInEnum()
            .WithMessage("BookState must be a valid value.");
    }
}