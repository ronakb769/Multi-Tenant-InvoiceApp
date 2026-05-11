namespace InvoiceApp.Core.Entities;

public class Client : BaseEntity
{
    public Guid TenantId { get; set; }
    public Tenant Tenant { get; set; } = null!;
    public string Name { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string? Phone { get; set; }
    public string? Address { get; set; }
    public string? City { get; set; }
    public string? Country { get; set; }
    public string? TaxNumber { get; set; }
    public bool IsActive { get; set; } = true;
    public ICollection<Invoice> Invoices { get; set; } = new List<Invoice>();
}
