using InvoiceApp.Core.Interfaces;

namespace InvoiceApp.Infrastructure.Services;

public class TenantContext : ITenantContext
{
    public Guid TenantId { get; set; }
    public Guid UserId { get; set; }
    public string UserRole { get; set; } = string.Empty;
    public bool IsSuperAdmin => UserRole == Core.Constants.Roles.SuperAdmin;
}
