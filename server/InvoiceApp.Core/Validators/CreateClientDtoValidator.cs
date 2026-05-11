using FluentValidation;
using InvoiceApp.Core.DTOs.Client;

namespace InvoiceApp.Core.Validators;

public class CreateClientDtoValidator : AbstractValidator<CreateClientDto>
{
    public CreateClientDtoValidator()
    {
        RuleFor(x => x.Name).NotEmpty().MaximumLength(200);
        RuleFor(x => x.Email).NotEmpty().EmailAddress().MaximumLength(200);
        RuleFor(x => x.Phone).MaximumLength(50).When(x => x.Phone != null);
        RuleFor(x => x.Address).MaximumLength(500).When(x => x.Address != null);
        RuleFor(x => x.City).MaximumLength(100).When(x => x.City != null);
        RuleFor(x => x.Country).MaximumLength(100).When(x => x.Country != null);
        RuleFor(x => x.TaxNumber).MaximumLength(50).When(x => x.TaxNumber != null);
    }
}
