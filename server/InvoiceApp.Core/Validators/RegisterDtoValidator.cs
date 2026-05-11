using FluentValidation;
using InvoiceApp.Core.DTOs.Auth;

namespace InvoiceApp.Core.Validators;

public class RegisterDtoValidator : AbstractValidator<RegisterDto>
{
    public RegisterDtoValidator()
    {
        RuleFor(x => x.Name).NotEmpty().MaximumLength(100);
        RuleFor(x => x.Email).NotEmpty().EmailAddress().MaximumLength(200);
        RuleFor(x => x.Password)
            .NotEmpty()
            .MinimumLength(8)
            .Matches(@"[A-Z]").WithMessage("Password must contain at least one uppercase letter.")
            .Matches(@"[a-z]").WithMessage("Password must contain at least one lowercase letter.")
            .Matches(@"[0-9]").WithMessage("Password must contain at least one digit.")
            .Matches(@"[\W_]").WithMessage("Password must contain at least one special character.");
        RuleFor(x => x.TenantName).NotEmpty().MaximumLength(100);
        RuleFor(x => x.Subdomain)
            .NotEmpty()
            .MaximumLength(50)
            .Matches(@"^[a-z0-9-]+$").WithMessage("Subdomain can only contain lowercase letters, numbers, and hyphens.");
    }
}
