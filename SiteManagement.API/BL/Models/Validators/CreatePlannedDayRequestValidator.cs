using FluentValidation;
using System.Globalization;

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

        RuleFor(x => x.StartTime)
            .NotEmpty()
            .WithMessage("StartTime is required.")
            .Must(BeValidTimeFormat)
            .WithMessage("StartTime must be in the format 'HH:mm' (e.g., '09:00', '14:30').");
    }

    private static bool BeValidTimeFormat(string startTime)
    {
        return TimeOnly.TryParseExact(
            startTime,
            "HH:mm",
            CultureInfo.InvariantCulture,
            DateTimeStyles.None,
            out _);
    }
}