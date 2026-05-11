using InvoiceApp.Core.Constants;
using InvoiceApp.Core.DTOs.Common;
using InvoiceApp.Core.Entities;
using InvoiceApp.Core.Interfaces.Repositories;
using InvoiceApp.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace InvoiceApp.Infrastructure.Repositories;

public class ClientRepository : GenericRepository<Client>, IClientRepository
{
    public ClientRepository(AppDbContext context) : base(context) { }

    public async Task<Client?> GetByIdWithInvoicesAsync(Guid id)
    {
        return await _context.Clients
            .Include(x => x.Invoices)
            .FirstOrDefaultAsync(x => x.Id == id);
    }

    public async Task<PagedResult<Client>> GetPagedAsync(
        PaginationParams pagination,
        string? search = null,
        bool? isActive = null)
    {
        var query = _context.Clients.AsNoTracking();

        if (!string.IsNullOrEmpty(search))
            query = query.Where(x => x.Name.Contains(search) || x.Email.Contains(search));

        if (isActive.HasValue)
            query = query.Where(x => x.IsActive == isActive.Value);

        query = query.OrderBy(x => x.Name);

        var totalCount = await query.CountAsync();
        var items = await query
            .Skip((pagination.Page - 1) * pagination.Limit)
            .Take(pagination.Limit)
            .ToListAsync();

        return new PagedResult<Client>
        {
            Items = items,
            TotalCount = totalCount,
            Page = pagination.Page,
            Limit = pagination.Limit
        };
    }

    public async Task<bool> EmailExistsAsync(string email, Guid tenantId, Guid? excludeId = null)
    {
        var query = _context.Clients.Where(x => x.Email == email && x.TenantId == tenantId);
        if (excludeId.HasValue)
            query = query.Where(x => x.Id != excludeId.Value);
        return await query.AnyAsync();
    }

    public async Task<List<object>> GetTopClientsByRevenueAsync(Guid tenantId, int count = 5)
    {
        var result = await _context.Clients
            .Include(x => x.Invoices)
            .Select(c => new
            {
                c.Id,
                c.Name,
                c.Email,
                TotalRevenue = c.Invoices
                    .Where(i => i.Status == InvoiceStatus.Paid)
                    .Sum(i => i.TotalAmount),
                InvoiceCount = c.Invoices.Count
            })
            .OrderByDescending(x => x.TotalRevenue)
            .Take(count)
            .ToListAsync();

        return result.Cast<object>().ToList();
    }
}
