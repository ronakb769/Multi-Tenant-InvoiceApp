namespace InvoiceApp.Core.Entities;

public class TaxRate : BaseEntity
{
    public Guid TenantId { get; set; }
    public string Name { get; set; } = string.Empty;
    public decimal Rate { get; set; }
    public bool IsDefault { get; set; }
}
