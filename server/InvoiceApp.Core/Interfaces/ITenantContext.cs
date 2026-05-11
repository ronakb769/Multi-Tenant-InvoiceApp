namespace InvoiceApp.Core.Interfaces;

public interface ITenantContext
{
    Guid TenantId { get; set; }
    Guid UserId { get; set; }
    string UserRole { get; set; }
    bool IsSuperAdmin { get; }
}
