using InvoiceApp.Core.DTOs.Client;
using InvoiceApp.Core.DTOs.Common;
using InvoiceApp.Core.DTOs.Invoice;
using InvoiceApp.Core.Entities;
using InvoiceApp.Core.Interfaces;
using InvoiceApp.Core.Interfaces.Repositories;
using InvoiceApp.Core.Interfaces.Services;
using InvoiceApp.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace InvoiceApp.Infrastructure.Services;

public class ClientService : IClientService
{
    private readonly IClientRepository _clientRepo;
    private readonly ITenantContext _tenantContext;
    private readonly AppDbContext _context;

    public ClientService(IClientRepository clientRepo, ITenantContext tenantContext, AppDbContext context)
    {
        _clientRepo = clientRepo;
        _tenantContext = tenantContext;
        _context = context;
    }

    public async Task<PagedResult<ClientResponseDto>> GetAllAsync(PaginationParams pagination, string? search = null, bool? isActive = null)
    {
        var result = await _clientRepo.GetPagedAsync(pagination, search, isActive);
        var dtos = new List<ClientResponseDto>();

        foreach (var c in result.Items)
        {
            var invoiceStats = await _context.Invoices
                .Where(i => i.ClientId == c.Id)
                .GroupBy(i => i.ClientId)
                .Select(g => new { Count = g.Count(), Revenue = g.Where(i => i.Status == "Paid").Sum(i => i.TotalAmount) })
                .FirstOrDefaultAsync();

            dtos.Add(new ClientResponseDto
            {
                Id = c.Id,
                Name = c.Name,
                Email = c.Email,
                Phone = c.Phone,
                Address = c.Address,
                City = c.City,
                Country = c.Country,
                TaxNumber = c.TaxNumber,
                IsActive = c.IsActive,
                CreatedAt = c.CreatedAt,
                TotalInvoices = invoiceStats?.Count ?? 0,
                TotalRevenue = invoiceStats?.Revenue ?? 0
            });
        }

        return new PagedResult<ClientResponseDto>
        {
            Items = dtos,
            TotalCount = result.TotalCount,
            Page = result.Page,
            Limit = result.Limit
        };
    }

    public async Task<ClientResponseDto> GetByIdAsync(Guid id)
    {
        var client = await _clientRepo.GetByIdAsync(id)
            ?? throw new KeyNotFoundException($"Client {id} not found.");

        var invoiceStats = await _context.Invoices
            .Where(i => i.ClientId == id)
            .GroupBy(i => i.ClientId)
            .Select(g => new { Count = g.Count(), Revenue = g.Where(i => i.Status == "Paid").Sum(i => i.TotalAmount) })
            .FirstOrDefaultAsync();

        return new ClientResponseDto
        {
            Id = client.Id,
            Name = client.Name,
            Email = client.Email,
            Phone = client.Phone,
            Address = client.Address,
            City = client.City,
            Country = client.Country,
            TaxNumber = client.TaxNumber,
            IsActive = client.IsActive,
            CreatedAt = client.CreatedAt,
            TotalInvoices = invoiceStats?.Count ?? 0,
            TotalRevenue = invoiceStats?.Revenue ?? 0
        };
    }

    public async Task<ClientResponseDto> CreateAsync(CreateClientDto dto)
    {
        if (await _clientRepo.EmailExistsAsync(dto.Email, _tenantContext.TenantId))
            throw new InvalidOperationException("A client with this email already exists.");

        var client = new Client
        {
            TenantId = _tenantContext.TenantId,
            Name = dto.Name,
            Email = dto.Email,
            Phone = dto.Phone,
            Address = dto.Address,
            City = dto.City,
            Country = dto.Country,
            TaxNumber = dto.TaxNumber
        };

        _context.Clients.Add(client);
        await _context.SaveChangesAsync();
        return await GetByIdAsync(client.Id);
    }

    public async Task<ClientResponseDto> UpdateAsync(Guid id, UpdateClientDto dto)
    {
        var client = await _context.Clients.FindAsync(id)
            ?? throw new KeyNotFoundException($"Client {id} not found.");

        if (dto.Email != null && dto.Email != client.Email)
        {
            if (await _clientRepo.EmailExistsAsync(dto.Email, _tenantContext.TenantId, id))
                throw new InvalidOperationException("A client with this email already exists.");
            client.Email = dto.Email;
        }

        if (dto.Name != null) client.Name = dto.Name;
        if (dto.Phone != null) client.Phone = dto.Phone;
        if (dto.Address != null) client.Address = dto.Address;
        if (dto.City != null) client.City = dto.City;
        if (dto.Country != null) client.Country = dto.Country;
        if (dto.TaxNumber != null) client.TaxNumber = dto.TaxNumber;
        if (dto.IsActive.HasValue) client.IsActive = dto.IsActive.Value;

        await _context.SaveChangesAsync();
        return await GetByIdAsync(client.Id);
    }

    public async Task DeleteAsync(Guid id)
    {
        var client = await _context.Clients.FindAsync(id)
            ?? throw new KeyNotFoundException($"Client {id} not found.");
        client.IsActive = false;
        await _context.SaveChangesAsync();
    }

    public async Task<PagedResult<InvoiceResponseDto>> GetClientInvoicesAsync(Guid clientId, PaginationParams pagination)
    {
        var query = _context.Invoices
            .Include(x => x.LineItems)
            .Where(x => x.ClientId == clientId)
            .OrderByDescending(x => x.CreatedAt);

        var total = await query.CountAsync();
        var items = await query
            .Skip((pagination.Page - 1) * pagination.Limit)
            .Take(pagination.Limit)
            .ToListAsync();

        return new PagedResult<InvoiceResponseDto>
        {
            Items = items.Select(MapInvoiceToDto).ToList(),
            TotalCount = total,
            Page = pagination.Page,
            Limit = pagination.Limit
        };
    }

    private static InvoiceResponseDto MapInvoiceToDto(Core.Entities.Invoice inv) => new()
    {
        Id = inv.Id,
        InvoiceNumber = inv.InvoiceNumber,
        Status = inv.Status,
        IssueDate = inv.IssueDate,
        DueDate = inv.DueDate,
        TotalAmount = inv.TotalAmount,
        CreatedAt = inv.CreatedAt
    };
}
