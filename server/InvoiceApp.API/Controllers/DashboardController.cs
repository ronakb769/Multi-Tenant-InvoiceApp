using InvoiceApp.Core.Constants;
using InvoiceApp.Core.DTOs.Common;
using InvoiceApp.Core.DTOs.Dashboard;
using InvoiceApp.Core.Interfaces.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace InvoiceApp.API.Controllers;

[ApiController]
[Route("api/v1/dashboard")]
[Authorize(Roles = $"{Roles.TenantAdmin},{Roles.User}")]
public class DashboardController : ControllerBase
{
    private readonly IDashboardService _dashboardService;

    public DashboardController(IDashboardService dashboardService)
    {
        _dashboardService = dashboardService;
    }

    [HttpGet("stats")]
    public async Task<ActionResult<ApiResponse<DashboardStatsDto>>> GetStats()
    {
        var result = await _dashboardService.GetStatsAsync();
        return Ok(ApiResponse<DashboardStatsDto>.Ok(result));
    }

    [HttpGet("revenue-chart")]
    [Authorize(Roles = Roles.TenantAdmin)]
    public async Task<ActionResult<ApiResponse<List<RevenueChartDto>>>> GetRevenueChart()
    {
        var result = await _dashboardService.GetRevenueChartAsync();
        return Ok(ApiResponse<List<RevenueChartDto>>.Ok(result));
    }

    [HttpGet("invoice-status-chart")]
    [Authorize(Roles = Roles.TenantAdmin)]
    public async Task<ActionResult<ApiResponse<Dictionary<string, int>>>> GetInvoiceStatusChart()
    {
        var result = await _dashboardService.GetInvoiceStatusChartAsync();
        return Ok(ApiResponse<Dictionary<string, int>>.Ok(result));
    }

    [HttpGet("top-clients")]
    [Authorize(Roles = Roles.TenantAdmin)]
    public async Task<ActionResult<ApiResponse<List<object>>>> GetTopClients()
    {
        var result = await _dashboardService.GetTopClientsAsync();
        return Ok(ApiResponse<List<object>>.Ok(result));
    }

    [HttpGet("recent-invoices")]
    public async Task<ActionResult<ApiResponse<List<object>>>> GetRecentInvoices()
    {
        var result = await _dashboardService.GetRecentInvoicesAsync();
        return Ok(ApiResponse<List<object>>.Ok(result));
    }

    [HttpGet("overdue-alerts")]
    [Authorize(Roles = Roles.TenantAdmin)]
    public async Task<ActionResult<ApiResponse<List<object>>>> GetOverdueAlerts()
    {
        var result = await _dashboardService.GetOverdueAlertsAsync();
        return Ok(ApiResponse<List<object>>.Ok(result));
    }
}
