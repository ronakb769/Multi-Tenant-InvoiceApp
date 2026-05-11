using InvoiceApp.Core.Entities;
using InvoiceApp.Core.Interfaces.Services;
using MailKit.Net.Smtp;
using MailKit.Security;
using Microsoft.Extensions.Configuration;
using MimeKit;

namespace InvoiceApp.Infrastructure.Services;

public class EmailService : IEmailService
{
    private readonly IConfiguration _config;

    public EmailService(IConfiguration config)
    {
        _config = config;
    }

    public async Task SendInvoiceEmailAsync(Invoice invoice, byte[] pdfBytes)
    {
        var message = new MimeMessage();
        message.From.Add(new MailboxAddress(
            _config["Email:FromName"] ?? "InvoiceApp",
            _config["Email:Username"]!));
        message.To.Add(MailboxAddress.Parse(invoice.Client!.Email));
        message.Subject = $"Invoice {invoice.InvoiceNumber} from {invoice.Tenant?.Name}";

        var builder = new BodyBuilder
        {
            HtmlBody = $@"
                <h2>Invoice {invoice.InvoiceNumber}</h2>
                <p>Dear {invoice.Client.Name},</p>
                <p>Please find your invoice attached. Total amount due: <strong>${invoice.TotalAmount:F2}</strong></p>
                <p>Due date: <strong>{invoice.DueDate:MMMM dd, yyyy}</strong></p>
                <p>Thank you for your business!</p>
                <p>Best regards,<br>{invoice.Tenant?.Name}</p>"
        };

        builder.Attachments.Add($"Invoice-{invoice.InvoiceNumber}.pdf", pdfBytes,
            new MimeKit.ContentType("application", "pdf"));

        message.Body = builder.ToMessageBody();
        await SendAsync(message);
    }

    public async Task SendPaymentConfirmationEmailAsync(Invoice invoice, Payment payment)
    {
        var message = new MimeMessage();
        message.From.Add(new MailboxAddress(
            _config["Email:FromName"] ?? "InvoiceApp",
            _config["Email:Username"]!));
        message.To.Add(MailboxAddress.Parse(invoice.Client!.Email));
        message.Subject = $"Payment Confirmed - Invoice {invoice.InvoiceNumber}";

        var builder = new BodyBuilder
        {
            HtmlBody = $@"
                <h2>Payment Confirmed</h2>
                <p>Dear {invoice.Client.Name},</p>
                <p>We've received your payment of <strong>${payment.Amount:F2}</strong> for invoice {invoice.InvoiceNumber}.</p>
                <p>Thank you!</p>"
        };

        message.Body = builder.ToMessageBody();
        await SendAsync(message);
    }

    public async Task SendWelcomeEmailAsync(User user)
    {
        var message = new MimeMessage();
        message.From.Add(new MailboxAddress(
            _config["Email:FromName"] ?? "InvoiceApp",
            _config["Email:Username"]!));
        message.To.Add(MailboxAddress.Parse(user.Email));
        message.Subject = "Welcome to InvoicePro!";

        var builder = new BodyBuilder
        {
            HtmlBody = $@"
                <h2>Welcome to InvoicePro, {user.Name}!</h2>
                <p>Your account has been created. Start creating professional invoices today.</p>"
        };

        message.Body = builder.ToMessageBody();
        await SendAsync(message);
    }

    private async Task SendAsync(MimeMessage message)
    {
        using var client = new SmtpClient();
        await client.ConnectAsync(
            _config["Email:Host"]!,
            int.Parse(_config["Email:Port"] ?? "587"),
            SecureSocketOptions.StartTls);
        await client.AuthenticateAsync(
            _config["Email:Username"]!,
            _config["Email:Password"]!);
        await client.SendAsync(message);
        await client.DisconnectAsync(true);
    }
}
