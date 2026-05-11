using InvoiceApp.Core.DTOs.Dashboard;

namespace InvoiceApp.Core.Interfaces.Services;

public interface IDashboardService
{
    Task<DashboardStatsDto> GetStatsAsync();
    Task<List<RevenueChartDto>> GetRevenueChartAsync();
    Task<Dictionary<string, int>> GetInvoiceStatusChartAsync();
    Task<List<object>> GetTopClientsAsync();
    Task<List<object>> GetRecentInvoicesAsync();
    Task<List<object>> GetOverdueAlertsAsync();
    Task<object> GetAdminStatsAsync();
    Task<List<object>> GetPlatformRevenueAsync();
    Task<List<object>> GetAllTenantsAsync();
    Task<object> GetTenantDetailAsync(Guid tenantId);
}
