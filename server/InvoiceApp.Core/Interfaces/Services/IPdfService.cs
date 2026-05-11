using InvoiceApp.Core.Entities;

namespace InvoiceApp.Core.Interfaces.Services;

public interface IPdfService
{
    Task<byte[]> GenerateInvoicePdfAsync(Invoice invoice);
}
