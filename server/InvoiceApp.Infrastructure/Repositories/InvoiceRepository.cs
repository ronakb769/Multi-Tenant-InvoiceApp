using InvoiceApp.Core.Constants;
using InvoiceApp.Core.DTOs.Common;
using InvoiceApp.Core.Entities;
using InvoiceApp.Core.Interfaces.Repositories;
using InvoiceApp.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace InvoiceApp.Infrastructure.Repositories;

public class InvoiceRepository : GenericRepository<Invoice>, IInvoiceRepository
{
    public InvoiceRepository(AppDbContext context) : base(context) { }

    public async Task<Invoice?> GetByIdWithDetailsAsync(Guid id)
    {
        return await _context.Invoices
            .Include(x => x.Client)
            .Include(x => x.LineItems)
            .Include(x => x.Payments)
            .Include(x => x.Tenant)
            .FirstOrDefaultAsync(x => x.Id == id);
    }

    public async Task<PagedResult<Invoice>> GetPagedAsync(
        PaginationParams pagination,
        string? status = null,
        Guid? clientId = null,
        string? search = null,
        string? sort = null,
        DateTime? dateFrom = null,
        DateTime? dateTo = null)
    {
        var query = _context.Invoices
            .Include(x => x.Client)
            .Include(x => x.LineItems)
            .AsNoTracking();

        if (!string.IsNullOrEmpty(status))
            query = query.Where(x => x.Status == status);

        if (clientId.HasValue)
            query = query.Where(x => x.ClientId == clientId.Value);

        if (!string.IsNullOrEmpty(search))
            query = query.Where(x => x.InvoiceNumber.Contains(search) ||
                                     x.Client.Name.Contains(search));

        if (dateFrom.HasValue)
            query = query.Where(x => x.IssueDate >= dateFrom.Value);

        if (dateTo.HasValue)
            query = query.Where(x => x.IssueDate <= dateTo.Value);

        query = sort switch
        {
            "amount_asc" => query.OrderBy(x => x.TotalAmount),
            "amount_desc" => query.OrderByDescending(x => x.TotalAmount),
            "date_asc" => query.OrderBy(x => x.IssueDate),
            _ => query.OrderByDescending(x => x.CreatedAt)
        };

        var totalCount = await query.CountAsync();
        var items = await query
            .Skip((pagination.Page - 1) * pagination.Limit)
            .Take(pagination.Limit)
            .ToListAsync();

        return new PagedResult<Invoice>
        {
            Items = items,
            TotalCount = totalCount,
            Page = pagination.Page,
            Limit = pagination.Limit
        };
    }

    public async Task<int> GetNextSequenceAsync(Guid tenantId)
    {
        return await _context.Invoices
            .IgnoreQueryFilters()
            .Where(x => x.TenantId == tenantId)
            .CountAsync() + 1;
    }

    public async Task<List<Invoice>> GetOverdueInvoicesAsync()
    {
        return await _context.Invoices
            .IgnoreQueryFilters()
            .Where(x => x.Status == InvoiceStatus.Sent && x.DueDate.Date < DateTime.UtcNow.Date)
            .ToListAsync();
    }

    public async Task<decimal> GetTotalRevenueAsync(Guid tenantId)
    {
        return await _context.Invoices
            .Where(x => x.Status == InvoiceStatus.Paid)
            .SumAsync(x => x.TotalAmount);
    }

    public async Task<decimal> GetOutstandingAmountAsync(Guid tenantId)
    {
        return await _context.Invoices
            .Where(x => x.Status == InvoiceStatus.Sent || x.Status == InvoiceStatus.Overdue)
            .SumAsync(x => x.TotalAmount);
    }

    public async Task<List<object>> GetMonthlyRevenueAsync(Guid tenantId, int months = 12)
    {
        var startDate = DateTime.UtcNow.AddMonths(-months + 1);
        var result = await _context.Invoices
            .Where(x => x.Status == InvoiceStatus.Paid && x.PaidAt >= startDate)
            .GroupBy(x => new { x.PaidAt!.Value.Year, x.PaidAt.Value.Month })
            .Select(g => new
            {
                Year = g.Key.Year,
                Month = g.Key.Month,
                Revenue = g.Sum(x => x.TotalAmount),
                Count = g.Count()
            })
            .OrderBy(x => x.Year)
            .ThenBy(x => x.Month)
            .ToListAsync();

        return result.Cast<object>().ToList();
    }

    public async Task<Dictionary<string, int>> GetStatusCountsAsync(Guid tenantId)
    {
        var counts = await _context.Invoices
            .GroupBy(x => x.Status)
            .Select(g => new { Status = g.Key, Count = g.Count() })
            .ToListAsync();

        return counts.ToDictionary(x => x.Status, x => x.Count);
    }
}
