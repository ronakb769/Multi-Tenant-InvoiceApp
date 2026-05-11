namespace InvoiceApp.Core.Entities;

public class Invoice : BaseEntity
{
    public Guid TenantId { get; set; }
    public Tenant Tenant { get; set; } = null!;
    public Guid ClientId { get; set; }
    public Client Client { get; set; } = null!;
    public string InvoiceNumber { get; set; } = string.Empty;
    public string Status { get; set; } = "Draft";
    public DateTime IssueDate { get; set; }
    public DateTime DueDate { get; set; }
    public ICollection<InvoiceLineItem> LineItems { get; set; } = new List<InvoiceLineItem>();
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
    public byte[]? RowVersion { get; set; }
    public ICollection<Payment> Payments { get; set; } = new List<Payment>();
}
