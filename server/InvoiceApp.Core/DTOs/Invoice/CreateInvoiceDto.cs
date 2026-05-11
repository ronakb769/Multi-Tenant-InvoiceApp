namespace InvoiceApp.Core.DTOs.Invoice;

public class CreateInvoiceDto
{
    public Guid ClientId { get; set; }
    public DateTime IssueDate { get; set; }
    public DateTime DueDate { get; set; }
    public List<InvoiceLineItemDto> LineItems { get; set; } = new();
    public decimal TaxRate { get; set; }
    public decimal DiscountAmount { get; set; }
    public string? Notes { get; set; }
}
