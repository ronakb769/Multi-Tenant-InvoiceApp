using InvoiceApp.Core.DTOs.Client;

namespace InvoiceApp.Core.DTOs.Invoice;

public class InvoiceResponseDto
{
    public Guid Id { get; set; }
    public string InvoiceNumber { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public string? TenantName { get; set; } = string.Empty;
    public string? TenantLogoUrl { get; set; }
    public string? TenantPrimaryColor { get; set; }
    public DateTime IssueDate { get; set; }
    public DateTime DueDate { get; set; }
    public decimal SubTotal { get; set; }
    public decimal TaxAmount { get; set; }
    public decimal TaxRate { get; set; }
    public decimal DiscountAmount { get; set; }
    public decimal TotalAmount { get; set; }
    public string? Notes { get; set; }
    public string? PdfBlobUrl { get; set; }
    public string? StripePaymentId { get; set; }
    public DateTime? PaidAt { get; set; }
    public DateTime? SentAt { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    public Guid ClientId { get; set; }
    public ClientResponseDto? Client { get; set; }
    public List<InvoiceLineItemDto> LineItems { get; set; } = new();
    public List<PaymentDto> Payments { get; set; } = new();
    public byte[]? RowVersion { get; set; }
}

public class PaymentDto
{
    public Guid Id { get; set; }
    public decimal Amount { get; set; }
    public string Currency { get; set; } = string.Empty;
    public string? StripePaymentIntentId { get; set; }
    public string Status { get; set; } = string.Empty;
    public DateTime? PaidAt { get; set; }
    public string? PaymentMethod { get; set; }
}
