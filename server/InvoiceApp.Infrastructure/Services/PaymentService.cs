using InvoiceApp.Core.Constants;
using InvoiceApp.Core.DTOs.Common;
using InvoiceApp.Core.Entities;
using InvoiceApp.Core.Interfaces;
using InvoiceApp.Core.Interfaces.Services;
using InvoiceApp.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Stripe;

namespace InvoiceApp.Infrastructure.Services;

public class PaymentService : IPaymentService
{
    private readonly AppDbContext _context;
    private readonly ITenantContext _tenantContext;
    private readonly IConfiguration _config;

    public PaymentService(AppDbContext context, ITenantContext tenantContext, IConfiguration config)
    {
        _context = context;
        _tenantContext = tenantContext;
        _config = config;
    }

    public async Task<PagedResult<object>> GetAllAsync(PaginationParams pagination)
    {
        var query = _context.Payments
            .Include(x => x.Invoice)
            .OrderByDescending(x => x.CreatedAt);

        var total = await query.CountAsync();
        var items = await query
            .Skip((pagination.Page - 1) * pagination.Limit)
            .Take(pagination.Limit)
            .Select(p => (object)new
            {
                p.Id,
                p.Amount,
                p.Currency,
                p.Status,
                p.PaidAt,
                p.PaymentMethod,
                p.StripePaymentIntentId,
                InvoiceNumber = p.Invoice.InvoiceNumber,
                InvoiceId = p.InvoiceId
            })
            .ToListAsync();

        return new PagedResult<object>
        {
            Items = items,
            TotalCount = total,
            Page = pagination.Page,
            Limit = pagination.Limit
        };
    }

    public async Task<List<object>> GetByInvoiceAsync(Guid invoiceId)
    {
        return await _context.Payments
            .Where(x => x.InvoiceId == invoiceId)
            .OrderByDescending(x => x.CreatedAt)
            .Select(p => (object)new
            {
                p.Id,
                p.Amount,
                p.Currency,
                p.Status,
                p.PaidAt,
                p.PaymentMethod,
                p.StripePaymentIntentId,
                p.StripeChargeId
            })
            .ToListAsync();
    }

    public async Task HandleStripeWebhookAsync(string payload, string signature)
    {
        var webhookSecret = _config["Stripe:WebhookSecret"]!;
        StripeConfiguration.ApiKey = _config["Stripe:SecretKey"];

        var stripeEvent = EventUtility.ConstructEvent(payload, signature, webhookSecret);

        if (stripeEvent.Type == Events.PaymentIntentSucceeded)
        {
            var paymentIntent = stripeEvent.Data.Object as PaymentIntent;
            if (paymentIntent == null) return;

            if (!paymentIntent.Metadata.TryGetValue("invoiceId", out var invoiceIdStr)) return;
            if (!Guid.TryParse(invoiceIdStr, out var invoiceId)) return;

            var invoice = await _context.Invoices.IgnoreQueryFilters().FirstOrDefaultAsync(x => x.Id == invoiceId);
            if (invoice == null) return;

            invoice.Status = InvoiceStatus.Paid;
            invoice.PaidAt = DateTime.UtcNow;

            var payment = new Payment
            {
                TenantId = invoice.TenantId,
                InvoiceId = invoice.Id,
                Amount = invoice.TotalAmount,
                Currency = _config["Stripe:Currency"] ?? "USD",
                StripePaymentIntentId = paymentIntent.Id,
                StripeChargeId = paymentIntent.LatestChargeId,
                Status = "Succeeded",
                PaidAt = DateTime.UtcNow,
                PaymentMethod = paymentIntent.PaymentMethodTypes?.FirstOrDefault() ?? "card"
            };

            _context.Payments.Add(payment);
            await _context.SaveChangesAsync();
        }
        else if (stripeEvent.Type == Events.PaymentIntentPaymentFailed)
        {
            var paymentIntent = stripeEvent.Data.Object as PaymentIntent;
            if (paymentIntent == null) return;

            if (paymentIntent.Metadata.TryGetValue("invoiceId", out var invoiceIdStr) &&
                Guid.TryParse(invoiceIdStr, out var invoiceId))
            {
                var payment = new Payment
                {
                    TenantId = Guid.Empty,
                    InvoiceId = invoiceId,
                    Amount = 0,
                    StripePaymentIntentId = paymentIntent.Id,
                    Status = "Failed",
                    PaidAt = null
                };
                _context.Payments.Add(payment);
                await _context.SaveChangesAsync();
            }
        }
    }
}
