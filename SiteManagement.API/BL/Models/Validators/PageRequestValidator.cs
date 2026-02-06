using FluentValidation;

namespace SiteManagement.API.BL.Models.Validators;

public class PageRequestValidator : AbstractValidator<PageRequest>
{
    public PageRequestValidator()
    {
        RuleFor(x => x.PageNumber)
            .GreaterThanOrEqualTo(1)
            .WithMessage("Page number must be at least 1");

        RuleFor(x => x.PageSize)
            .InclusiveBetween(1, 100)
            .WithMessage("Page size must be between 1 and 100");

        RuleForEach(x => x.Filters)
            .NotNull()
            .When(x => x.Filters is not null)
            .WithMessage("Filter groups cannot contain null values");
    }
}