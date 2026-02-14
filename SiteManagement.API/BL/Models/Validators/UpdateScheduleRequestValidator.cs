using FluentValidation;

namespace SiteManagement.API.BL.Models.Validators;

public class UpdateScheduleRequestValidator: AbstractValidator<UpdateScheduleRequest>
{
    public UpdateScheduleRequestValidator()
    {
        RuleFor(x => x.PlannedDays)
            .NotEmpty()
            .Must(p => p.Count() == 7 && p.Select(d => d.DayOfWeek).Distinct().Count() == 7)

            .WithMessage("Schedule must contain exactly 7 days (one for each day of the week) with no duplicates.");

        RuleForEach(x => x.PlannedDays).SetValidator(new CreatePlannedDayRequestValidator());
    }
}
