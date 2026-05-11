using InvoiceApp.Core.DTOs.Common;

namespace InvoiceApp.Core.Interfaces.Services;

public interface IPaymentService
{
    Task<PagedResult<object>> GetAllAsync(PaginationParams pagination);
    Task<List<object>> GetByInvoiceAsync(Guid invoiceId);
    Task HandleStripeWebhookAsync(string payload, string signature);
}
