using FluentValidation;

namespace SiteManagement.API.BL.Models.Validators;

public class CreatePlannedDayRequestValidator : AbstractValidator<CreatePlannedDayRequest>
{
    public CreatePlannedDayRequestValidator()
    {
        RuleFor(x => x.DayOfWeek)
            .IsInEnum()
            .WithMessage("DayOfWeek must be a valid day of the week.");

        RuleFor(x => x.NumberOfTimeSlots)
            .GreaterThan(0)
            .LessThanOrEqualTo(8)
            .WithMessage("NumberOfTimeSlots must be between 1 and 8.");
    }
}