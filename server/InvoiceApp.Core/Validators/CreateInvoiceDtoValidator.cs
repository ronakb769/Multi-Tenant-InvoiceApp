using FluentValidation;
using InvoiceApp.Core.DTOs.Invoice;

namespace InvoiceApp.Core.Validators;

public class CreateInvoiceDtoValidator : AbstractValidator<CreateInvoiceDto>
{
    public CreateInvoiceDtoValidator()
    {
        RuleFor(x => x.ClientId).NotEmpty();
        RuleFor(x => x.IssueDate).NotEmpty();
        RuleFor(x => x.DueDate)
            .NotEmpty()
            .GreaterThanOrEqualTo(x => x.IssueDate).WithMessage("Due date must be on or after issue date.");
        RuleFor(x => x.LineItems).NotEmpty().WithMessage("At least one line item is required.");
        RuleForEach(x => x.LineItems).ChildRules(item =>
        {
            item.RuleFor(i => i.Description).NotEmpty().MaximumLength(500);
            item.RuleFor(i => i.Quantity).GreaterThan(0);
            item.RuleFor(i => i.UnitPrice).GreaterThanOrEqualTo(0);
        });
        RuleFor(x => x.TaxRate).InclusiveBetween(0, 100);
        RuleFor(x => x.DiscountAmount).GreaterThanOrEqualTo(0);
    }
}
