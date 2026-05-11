using InvoiceApp.Core.DTOs.Common;
using InvoiceApp.Core.Entities;

namespace InvoiceApp.Core.Interfaces.Repositories;

public interface IInvoiceRepository : IGenericRepository<Invoice>
{
    Task<Invoice?> GetByIdWithDetailsAsync(Guid id);
    Task<PagedResult<Invoice>> GetPagedAsync(PaginationParams pagination, string? status = null, Guid? clientId = null, string? search = null, string? sort = null, DateTime? dateFrom = null, DateTime? dateTo = null);
    Task<int> GetNextSequenceAsync(Guid tenantId);
    Task<List<Invoice>> GetOverdueInvoicesAsync();
    Task<decimal> GetTotalRevenueAsync(Guid tenantId);
    Task<decimal> GetOutstandingAmountAsync(Guid tenantId);
    Task<List<object>> GetMonthlyRevenueAsync(Guid tenantId, int months = 12);
    Task<Dictionary<string, int>> GetStatusCountsAsync(Guid tenantId);
}
