using FluentValidation;

namespace SiteManagement.API.BL.Models.Validators;

public class CreateCourtRequestValidator : AbstractValidator<CreateCourtRequest>
{
    public CreateCourtRequestValidator()
    {
        RuleFor(x => x.Number)
            .GreaterThan(0)
            .LessThanOrEqualTo(100)
            .WithMessage("Court Number must be between 1 and 100.");
    }
}