using InvoiceApp.Core.Constants;
using InvoiceApp.Core.DTOs.Common;
using InvoiceApp.Core.Interfaces.Services;
using InvoiceApp.Infrastructure.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace InvoiceApp.API.Controllers;

[ApiController]
[Route("api/v1/admin")]
[Authorize(Roles = Roles.SuperAdmin)]
public class AdminController : ControllerBase
{
    private readonly IDashboardService _dashboardService;
    private readonly AppDbContext _context;

    public AdminController(IDashboardService dashboardService, AppDbContext context)
    {
        _dashboardService = dashboardService;
        _context = context;
    }

    [HttpGet("stats")]
    public async Task<ActionResult<ApiResponse<object>>> GetStats()
    {
        var result = await _dashboardService.GetAdminStatsAsync();
        return Ok(ApiResponse<object>.Ok(result));
    }

    [HttpGet("tenants")]
    public async Task<ActionResult<ApiResponse<List<object>>>> GetTenants()
    {
        var result = await _dashboardService.GetAllTenantsAsync();
        return Ok(ApiResponse<List<object>>.Ok(result));
    }

    [HttpGet("tenants/{tenantId}")]
    public async Task<ActionResult<ApiResponse<object>>> GetTenant(Guid tenantId)
    {
        var result = await _dashboardService.GetTenantDetailAsync(tenantId);
        return Ok(ApiResponse<object>.Ok(result));
    }

    [HttpPatch("tenants/{tenantId}/status")]
    public async Task<ActionResult<ApiResponse<object>>> UpdateTenantStatus(Guid tenantId, [FromBody] UpdateStatusDto dto)
    {
        var tenant = await _context.Tenants.IgnoreQueryFilters().FirstOrDefaultAsync(x => x.Id == tenantId)
            ?? throw new KeyNotFoundException("Tenant not found.");
        tenant.IsActive = dto.IsActive;
        await _context.SaveChangesAsync();
        return Ok(ApiResponse<object>.Ok(null!, "Tenant status updated."));
    }

    [HttpPatch("tenants/{tenantId}/plan")]
    public async Task<ActionResult<ApiResponse<object>>> UpdateTenantPlan(Guid tenantId, [FromBody] UpdatePlanDto dto)
    {
        var tenant = await _context.Tenants.IgnoreQueryFilters().FirstOrDefaultAsync(x => x.Id == tenantId)
            ?? throw new KeyNotFoundException("Tenant not found.");

        tenant.Plan = dto.Plan;
        tenant.MaxUsers = dto.Plan switch
        {
            "Pro" => 20,
            "Enterprise" => int.MaxValue,
            _ => 5
        };
        await _context.SaveChangesAsync();
        return Ok(ApiResponse<object>.Ok(null!, "Tenant plan updated."));
    }

    [HttpGet("users")]
    public async Task<ActionResult<ApiResponse<List<object>>>> GetUsers(
        [FromQuery] string? search,
        [FromQuery] string? role,
        [FromQuery] Guid? tenantId,
        [FromQuery] bool? isActive)
    {
        var query = _context.Users.IgnoreQueryFilters().Include(u => u.Tenant).AsQueryable();

        if (!string.IsNullOrEmpty(search))
            query = query.Where(u => u.Name.Contains(search) || u.Email.Contains(search));
        if (!string.IsNullOrEmpty(role))
            query = query.Where(u => u.Role == role);
        if (tenantId.HasValue)
            query = query.Where(u => u.TenantId == tenantId.Value);
        if (isActive.HasValue)
            query = query.Where(u => u.IsActive == isActive.Value);

        var users = await query.Select(u => (object)new
        {
            u.Id,
            u.Name,
            u.Email,
            u.Role,
            u.IsActive,
            u.LastLogin,
            TenantName = u.Tenant != null ? u.Tenant.Name : null,
            u.TenantId
        }).ToListAsync();

        return Ok(ApiResponse<List<object>>.Ok(users));
    }

    [HttpGet("platform-revenue")]
    public async Task<ActionResult<ApiResponse<List<object>>>> GetPlatformRevenue()
    {
        var result = await _dashboardService.GetPlatformRevenueAsync();
        return Ok(ApiResponse<List<object>>.Ok(result));
    }
}

public class UpdateStatusDto { public bool IsActive { get; set; } }
public class UpdatePlanDto { public string Plan { get; set; } = string.Empty; }
