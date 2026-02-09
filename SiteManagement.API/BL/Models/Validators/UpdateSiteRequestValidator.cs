using FluentValidation;

namespace SiteManagement.API.BL.Models.Validators;

public class UpdateSiteRequestValidator : AbstractValidator<UpdateSiteRequest>
{
    public UpdateSiteRequestValidator()
    {
        RuleFor(x => x.Name)
            .NotEmpty()
            .MaximumLength(200);

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