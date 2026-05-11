using InvoiceApp.Core.Constants;
using InvoiceApp.Core.DTOs.Dashboard;
using InvoiceApp.Core.Interfaces;
using InvoiceApp.Core.Interfaces.Services;
using InvoiceApp.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace InvoiceApp.Infrastructure.Services;

public class DashboardService : IDashboardService
{
    private readonly AppDbContext _context;
    private readonly ITenantContext _tenantContext;

    public DashboardService(AppDbContext context, ITenantContext tenantContext)
    {
        _context = context;
        _tenantContext = tenantContext;
    }

    public async Task<DashboardStatsDto> GetStatsAsync()
    {
        var now = DateTime.UtcNow;
        var monthStart = new DateTime(now.Year, now.Month, 1);

        return new DashboardStatsDto
        {
            TotalClients = await _context.Clients.CountAsync(),
            TotalInvoices = await _context.Invoices.CountAsync(),
            TotalRevenue = await _context.Invoices
                .Where(x => x.Status == InvoiceStatus.Paid)
                .SumAsync(x => (decimal?)x.TotalAmount) ?? 0,
            OutstandingAmount = await _context.Invoices
                .Where(x => x.Status == InvoiceStatus.Sent || x.Status == InvoiceStatus.Overdue)
                .SumAsync(x => (decimal?)x.TotalAmount) ?? 0,
            OverdueCount = await _context.Invoices
                .CountAsync(x => x.Status == InvoiceStatus.Overdue),
            PaidThisMonth = await _context.Invoices
                .Where(x => x.Status == InvoiceStatus.Paid && x.PaidAt >= monthStart)
                .SumAsync(x => (decimal?)x.TotalAmount) ?? 0
        };
    }

    public async Task<List<RevenueChartDto>> GetRevenueChartAsync()
    {
        var startDate = DateTime.UtcNow.AddMonths(-11);
        startDate = new DateTime(startDate.Year, startDate.Month, 1);

        var data = await _context.Invoices
            .Where(x => x.Status == InvoiceStatus.Paid && x.PaidAt >= startDate)
            .GroupBy(x => new { x.PaidAt!.Value.Year, x.PaidAt.Value.Month })
            .Select(g => new
            {
                g.Key.Year,
                g.Key.Month,
                Revenue = g.Sum(x => x.TotalAmount),
                Count = g.Count()
            })
            .ToListAsync();

        var result = new List<RevenueChartDto>();
        for (int i = 11; i >= 0; i--)
        {
            var date = DateTime.UtcNow.AddMonths(-i);
            var entry = data.FirstOrDefault(d => d.Year == date.Year && d.Month == date.Month);
            result.Add(new RevenueChartDto
            {
                Month = date.ToString("MMM yyyy"),
                Revenue = entry?.Revenue ?? 0,
                InvoiceCount = entry?.Count ?? 0
            });
        }

        return result;
    }

    public async Task<Dictionary<string, int>> GetInvoiceStatusChartAsync()
    {
        var data = await _context.Invoices
            .GroupBy(x => x.Status)
            .Select(g => new { Status = g.Key, Count = g.Count() })
            .ToListAsync();

        return data.ToDictionary(x => x.Status, x => x.Count);
    }

    public async Task<List<object>> GetTopClientsAsync()
    {
        var result = await _context.Clients
            .Select(c => new
            {
                c.Id,
                c.Name,
                c.Email,
                TotalRevenue = c.Invoices.Where(i => i.Status == InvoiceStatus.Paid).Sum(i => i.TotalAmount),
                InvoiceCount = c.Invoices.Count
            })
            .OrderByDescending(x => x.TotalRevenue)
            .Take(5)
            .ToListAsync();

        return result.Cast<object>().ToList();
    }

    public async Task<List<object>> GetRecentInvoicesAsync()
    {
        var result = await _context.Invoices
            .Include(x => x.Client)
            .OrderByDescending(x => x.CreatedAt)
            .Take(10)
            .Select(x => (object)new
            {
                x.Id,
                x.InvoiceNumber,
                ClientName = x.Client.Name,
                x.TotalAmount,
                x.Status,
                x.DueDate,
                x.CreatedAt
            })
            .ToListAsync();

        return result;
    }

    public async Task<List<object>> GetOverdueAlertsAsync()
    {
        var result = await _context.Invoices
            .Include(x => x.Client)
            .Where(x => x.Status == InvoiceStatus.Overdue)
            .OrderBy(x => x.DueDate)
            .Select(x => (object)new
            {
                x.Id,
                x.InvoiceNumber,
                ClientName = x.Client.Name,
                x.TotalAmount,
                x.DueDate,
                DaysOverdue = EF.Functions.DateDiffDay(x.DueDate, DateTime.UtcNow)
            })
            .ToListAsync();

        return result;
    }

    public async Task<object> GetAdminStatsAsync()
    {
        var now = DateTime.UtcNow;
        var monthStart = new DateTime(now.Year, now.Month, 1);

        return new
        {
            TotalTenants = await _context.Tenants.IgnoreQueryFilters().CountAsync(),
            ActiveTenants = await _context.Tenants.IgnoreQueryFilters().CountAsync(t => t.IsActive),
            TotalUsers = await _context.Users.IgnoreQueryFilters().CountAsync(),
            TotalInvoices = await _context.Invoices.IgnoreQueryFilters().CountAsync(),
            TotalRevenue = await _context.Invoices.IgnoreQueryFilters()
                .Where(x => x.Status == InvoiceStatus.Paid).SumAsync(x => (decimal?)x.TotalAmount) ?? 0,
            NewTenantsThisMonth = await _context.Tenants.IgnoreQueryFilters()
                .CountAsync(t => t.CreatedAt >= monthStart)
        };
    }

    public async Task<List<object>> GetPlatformRevenueAsync()
    {
        var startDate = DateTime.UtcNow.AddMonths(-11);
        startDate = new DateTime(startDate.Year, startDate.Month, 1);

        var data = await _context.Invoices.IgnoreQueryFilters()
            .Where(x => x.Status == InvoiceStatus.Paid && x.PaidAt >= startDate)
            .GroupBy(x => new { x.PaidAt!.Value.Year, x.PaidAt.Value.Month })
            .Select(g => new { g.Key.Year, g.Key.Month, Revenue = g.Sum(x => x.TotalAmount), Count = g.Count() })
            .ToListAsync();

        var result = new List<object>();
        for (int i = 11; i >= 0; i--)
        {
            var date = DateTime.UtcNow.AddMonths(-i);
            var entry = data.FirstOrDefault(d => d.Year == date.Year && d.Month == date.Month);
            result.Add(new
            {
                Month = date.ToString("MMM yyyy"),
                Revenue = entry?.Revenue ?? 0,
                Count = entry?.Count ?? 0
            });
        }
        return result;
    }

    public async Task<List<object>> GetAllTenantsAsync()
    {
        var tenants = await _context.Tenants.IgnoreQueryFilters()
            .Include(t => t.Users)
            .Include(t => t.Invoices)
            .ToListAsync();

        return tenants.Select(t => (object)new
        {
            t.Id,
            t.Name,
            t.Subdomain,
            t.Plan,
            t.IsActive,
            t.CreatedAt,
            UserCount = t.Users.Count,
            InvoiceCount = t.Invoices.Count,
            Revenue = t.Invoices.Where(i => i.Status == InvoiceStatus.Paid).Sum(i => i.TotalAmount)
        }).ToList();
    }

    public async Task<object> GetTenantDetailAsync(Guid tenantId)
    {
        var tenant = await _context.Tenants.IgnoreQueryFilters()
            .Include(t => t.Users)
            .Include(t => t.Invoices)
            .FirstOrDefaultAsync(t => t.Id == tenantId)
            ?? throw new KeyNotFoundException("Tenant not found.");

        return new
        {
            tenant.Id,
            tenant.Name,
            tenant.Subdomain,
            tenant.Plan,
            tenant.IsActive,
            tenant.CreatedAt,
            tenant.LogoUrl,
            tenant.PrimaryColor,
            tenant.MaxUsers,
            UserCount = tenant.Users.Count,
            InvoiceCount = tenant.Invoices.Count,
            Revenue = tenant.Invoices.Where(i => i.Status == InvoiceStatus.Paid).Sum(i => i.TotalAmount),
            Users = tenant.Users.Select(u => new { u.Id, u.Name, u.Email, u.Role, u.IsActive, u.LastLogin })
        };
    }
}
