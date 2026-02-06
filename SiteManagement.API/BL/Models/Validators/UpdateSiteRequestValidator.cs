using FluentValidation;

namespace SiteManagement.API.BL.Models.Validators;

public class UpdateSiteRequestValidator : AbstractValidator<UpdateSiteRequest>
{
    public UpdateSiteRequestValidator()
    {
        RuleFor(x => x.Name)
            .NotEmpty()
            .MaximumLength(200);

        RuleFor(x => x.Schedule)
            .NotEmpty()
            .Must(schedule => schedule?.Select(s => s.DayOfWeek).Distinct().Count() == 7)
            .WithMessage("Schedule must contain exactly 7 days (one for each day of the week) with no duplicates.");

        RuleForEach(x => x.Schedule)
            .ChildRules(schedule =>
            {
                schedule.RuleFor(s => s.DayOfWeek)
                    .IsInEnum();
                    
                schedule.RuleFor(s => s.NumberOfTimeSlots)
                    .GreaterThan(0)
                    .LessThanOrEqualTo(8);
            });

        When(x => x.Courts is not null, () =>
        {
            RuleForEach(x => x.Courts)
                .ChildRules(court =>
                {
                    court.RuleFor(c => c.Number)
                        .GreaterThan(0)
                        .LessThanOrEqualTo(100);
                });
        });

        When(x => x.ClosedDays is not null, () =>
        {
            RuleFor(x => x.ClosedDays)
                .Must(dates => dates!.Distinct().Count() == dates.Count())
                .WithMessage("ClosedDays must not contain duplicate dates.");
        });
    }
}