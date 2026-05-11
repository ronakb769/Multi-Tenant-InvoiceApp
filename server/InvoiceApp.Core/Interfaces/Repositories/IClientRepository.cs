using InvoiceApp.Core.DTOs.Common;
using InvoiceApp.Core.Entities;

namespace InvoiceApp.Core.Interfaces.Repositories;

public interface IClientRepository : IGenericRepository<Client>
{
    Task<Client?> GetByIdWithInvoicesAsync(Guid id);
    Task<PagedResult<Client>> GetPagedAsync(PaginationParams pagination, string? search = null, bool? isActive = null);
    Task<bool> EmailExistsAsync(string email, Guid tenantId, Guid? excludeId = null);
    Task<List<object>> GetTopClientsByRevenueAsync(Guid tenantId, int count = 5);
}
