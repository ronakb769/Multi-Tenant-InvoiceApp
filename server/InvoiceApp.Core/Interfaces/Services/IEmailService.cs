using InvoiceApp.Core.Entities;

namespace InvoiceApp.Core.Interfaces.Services;

public interface IEmailService
{
    Task SendInvoiceEmailAsync(Invoice invoice, byte[] pdfBytes);
    Task SendPaymentConfirmationEmailAsync(Invoice invoice, Payment payment);
    Task SendWelcomeEmailAsync(User user);
    Task SendPasswordResetEmailAsync(string toEmail, string toName, string resetLink);
}
