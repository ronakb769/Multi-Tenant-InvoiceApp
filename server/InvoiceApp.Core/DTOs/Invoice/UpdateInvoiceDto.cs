namespace InvoiceApp.Core.DTOs.Invoice;

public class UpdateInvoiceDto
{
    public Guid? ClientId { get; set; }
    public DateTime? IssueDate { get; set; }
    public DateTime? DueDate { get; set; }
    public List<InvoiceLineItemDto>? LineItems { get; set; }
    public decimal? TaxRate { get; set; }
    public decimal? DiscountAmount { get; set; }
    public string? Notes { get; set; }
    public byte[]? RowVersion { get; set; }
}
