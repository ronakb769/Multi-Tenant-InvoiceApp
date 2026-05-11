namespace InvoiceApp.Core.DTOs.Invoice;

public class InvoiceLineItemDto
{
    public Guid? Id { get; set; }
    public string Description { get; set; } = string.Empty;
    public decimal Quantity { get; set; }
    public decimal UnitPrice { get; set; }
    public decimal Amount { get; set; }
}
