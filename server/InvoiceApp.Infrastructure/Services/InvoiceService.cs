using InvoiceApp.Core.Constants;
using InvoiceApp.Core.DTOs.Client;
using InvoiceApp.Core.DTOs.Common;
using InvoiceApp.Core.DTOs.Invoice;
using InvoiceApp.Core.Entities;
using InvoiceApp.Core.Interfaces;
using InvoiceApp.Core.Interfaces.Repositories;
using InvoiceApp.Core.Interfaces.Services;
using InvoiceApp.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Stripe;
using CoreInvoice = InvoiceApp.Core.Entities.Invoice;
using CoreInvoiceLineItem = InvoiceApp.Core.Entities.InvoiceLineItem;

namespace InvoiceApp.Infrastructure.Services;

public class InvoiceService : IInvoiceService
{
    private readonly IInvoiceRepository _invoiceRepo;
    private readonly IClientRepository _clientRepo;
    private readonly ITenantContext _tenantContext;
    private readonly AppDbContext _context;
    private readonly IPdfService _pdfService;
    private readonly IEmailService _emailService;
    private readonly IConfiguration _config;

    public InvoiceService(
        IInvoiceRepository invoiceRepo,
        IClientRepository clientRepo,
        ITenantContext tenantContext,
        AppDbContext context,
        IPdfService pdfService,
        IEmailService emailService,
        IConfiguration config)
    {
        _invoiceRepo = invoiceRepo;
        _clientRepo = clientRepo;
        _tenantContext = tenantContext;
        _context = context;
        _pdfService = pdfService;
        _emailService = emailService;
        _config = config;
    }

    public async Task<PagedResult<InvoiceResponseDto>> GetAllAsync(
        PaginationParams pagination, string? status, Guid? clientId, string? search, string? sort, DateTime? dateFrom, DateTime? dateTo)
    {
        var result = await _invoiceRepo.GetPagedAsync(pagination, status, clientId, search, sort, dateFrom, dateTo);
        return new PagedResult<InvoiceResponseDto>
        {
            Items = result.Items.Select(MapToDto).ToList(),
            TotalCount = result.TotalCount,
            Page = result.Page,
            Limit = result.Limit
        };
    }

    public async Task<InvoiceResponseDto> GetByIdAsync(Guid id)
    {
        var invoice = await _invoiceRepo.GetByIdWithDetailsAsync(id)
            ?? throw new KeyNotFoundException($"Invoice {id} not found.");
        return MapToDto(invoice);
    }

    public async Task<InvoiceResponseDto> CreateAsync(CreateInvoiceDto dto)
    {
        var client = await _clientRepo.GetByIdAsync(dto.ClientId)
            ?? throw new KeyNotFoundException("Client not found.");

        var seq = await _invoiceRepo.GetNextSequenceAsync(_tenantContext.TenantId);
        var tenantShort = _tenantContext.TenantId.ToString().Replace("-", "").Substring(0, 4).ToUpper();
        var invoiceNumber = $"INV-{tenantShort}-{DateTime.UtcNow.Year}-{seq:D4}";

        var lineItems = dto.LineItems.Select(li => new CoreInvoiceLineItem
        {
            Description = li.Description,
            Quantity = li.Quantity,
            UnitPrice = li.UnitPrice,
            Amount = Math.Round(li.Quantity * li.UnitPrice, 2)
        }).ToList();

        var subTotal = lineItems.Sum(x => x.Amount);
        var taxAmount = Math.Round(subTotal * (dto.TaxRate / 100), 2);
        var totalAmount = subTotal + taxAmount - dto.DiscountAmount;

        var invoice = new CoreInvoice
        {
            TenantId = _tenantContext.TenantId,
            ClientId = dto.ClientId,
            InvoiceNumber = invoiceNumber,
            Status = InvoiceStatus.Draft,
            IssueDate = dto.IssueDate,
            DueDate = dto.DueDate,
            LineItems = lineItems,
            SubTotal = subTotal,
            TaxRate = dto.TaxRate,
            TaxAmount = taxAmount,
            DiscountAmount = dto.DiscountAmount,
            TotalAmount = totalAmount,
            Notes = dto.Notes
        };

        _context.Invoices.Add(invoice);
        await _context.SaveChangesAsync();

        return await GetByIdAsync(invoice.Id);
    }

    public async Task<InvoiceResponseDto> UpdateAsync(Guid id, UpdateInvoiceDto dto)
    {
        // Load WITHOUT .Include(LineItems) — replacing a navigation collection on a tracked
        // entity triggers EF Core DetectChanges fixup which corrupts the RowVersion snapshot.
        var invoice = await _context.Invoices
            .FirstOrDefaultAsync(x => x.Id == id)
            ?? throw new KeyNotFoundException($"Invoice {id} not found.");

        if (invoice.Status != InvoiceStatus.Draft)
            throw new InvalidOperationException("Only Draft invoices can be edited.");

        // Manual optimistic concurrency check against the value the client last saw.
        if (dto.RowVersion != null && invoice.RowVersion != null
            && !dto.RowVersion.SequenceEqual(invoice.RowVersion))
            throw new InvalidOperationException("Record was modified by another user, please refresh and try again.");

        if (dto.ClientId.HasValue) invoice.ClientId = dto.ClientId.Value;
        if (dto.IssueDate.HasValue) invoice.IssueDate = dto.IssueDate.Value;
        if (dto.DueDate.HasValue) invoice.DueDate = dto.DueDate.Value;
        if (dto.TaxRate.HasValue) invoice.TaxRate = dto.TaxRate.Value;
        if (dto.DiscountAmount.HasValue) invoice.DiscountAmount = dto.DiscountAmount.Value;
        if (dto.Notes != null) invoice.Notes = dto.Notes;

        await using var transaction = await _context.Database.BeginTransactionAsync();
        try
        {
            if (dto.LineItems != null)
            {
                // ExecuteDeleteAsync operates directly on the DB — no navigation collection
                // assignment means EF Core never replaces invoice.LineItems and the RowVersion
                // snapshot stays intact.
                await _context.InvoiceLineItems
                    .Where(x => x.InvoiceId == id)
                    .ExecuteDeleteAsync();

                var newLineItems = dto.LineItems.Select(li => new CoreInvoiceLineItem
                {
                    InvoiceId = invoice.Id,
                    Description = li.Description,
                    Quantity = li.Quantity,
                    UnitPrice = li.UnitPrice,
                    Amount = Math.Round(li.Quantity * li.UnitPrice, 2)
                }).ToList();

                _context.InvoiceLineItems.AddRange(newLineItems);
                invoice.SubTotal = newLineItems.Sum(x => x.Amount);
            }
            else
            {
                invoice.SubTotal = await _context.InvoiceLineItems
                    .Where(x => x.InvoiceId == id)
                    .SumAsync(x => x.Amount);
            }

            invoice.TaxAmount = Math.Round(invoice.SubTotal * (invoice.TaxRate / 100), 2);
            invoice.TotalAmount = invoice.SubTotal + invoice.TaxAmount - invoice.DiscountAmount;

            await _context.SaveChangesAsync();
            await transaction.CommitAsync();
        }
        catch
        {
            await transaction.RollbackAsync();
            throw;
        }

        return await GetByIdAsync(invoice.Id);
    }

    public async Task DeleteAsync(Guid id)
    {
        var invoice = await _context.Invoices.FindAsync(id)
            ?? throw new KeyNotFoundException($"Invoice {id} not found.");

        if (invoice.Status != InvoiceStatus.Draft)
            throw new InvalidOperationException("Only Draft invoices can be deleted.");

        _context.Invoices.Remove(invoice);
        await _context.SaveChangesAsync();
    }

    public async Task<InvoiceResponseDto> SendAsync(Guid id)
    {
        var invoice = await _invoiceRepo.GetByIdWithDetailsAsync(id)
            ?? throw new KeyNotFoundException($"Invoice {id} not found.");

        if (invoice.Status != InvoiceStatus.Draft)
            throw new InvalidOperationException("Only Draft invoices can be sent.");

        var pdfBytes = await _pdfService.GenerateInvoicePdfAsync(invoice);

        // Upload to Azure Blob and store URL on invoice
        try
        {
            invoice.PdfBlobUrl = await _pdfService.UploadPdfAsync(invoice);
        }
        catch (Exception)
        {
            // Blob upload failure doesn't block sending
        }

        try
        {
            await _emailService.SendInvoiceEmailAsync(invoice, pdfBytes);
        }
        catch (Exception)
        {
            // Email failure doesn't block sending
        }

        invoice.Status = InvoiceStatus.Sent;
        invoice.SentAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        return MapToDto(invoice);
    }

    public async Task<InvoiceResponseDto> CancelAsync(Guid id)
    {
        var invoice = await _context.Invoices.FindAsync(id)
            ?? throw new KeyNotFoundException($"Invoice {id} not found.");

        if (invoice.Status == InvoiceStatus.Paid)
            throw new InvalidOperationException("Paid invoices cannot be cancelled.");

        invoice.Status = InvoiceStatus.Cancelled;
        await _context.SaveChangesAsync();
        return await GetByIdAsync(invoice.Id);
    }

    public async Task<byte[]> GetPdfAsync(Guid id)
    {
        var invoice = await _invoiceRepo.GetByIdWithDetailsAsync(id)
            ?? throw new KeyNotFoundException($"Invoice {id} not found.");

        return await _pdfService.GenerateInvoicePdfAsync(invoice);
    }

    public async Task<string> CreatePaymentLinkAsync(Guid id)
    {
        var invoice = await _invoiceRepo.GetByIdWithDetailsAsync(id)
            ?? throw new KeyNotFoundException($"Invoice {id} not found.");

        StripeConfiguration.ApiKey = _config["Stripe:SecretKey"];
        var options = new PaymentIntentCreateOptions
        {
            Amount = (long)(invoice.TotalAmount * 100),
            Currency = _config["Stripe:Currency"] ?? "usd",
            Metadata = new Dictionary<string, string> { { "invoiceId", invoice.Id.ToString() } }
        };

        var service = new PaymentIntentService();
        var intent = await service.CreateAsync(options);

        invoice.StripePaymentId = intent.Id;
        await _context.SaveChangesAsync();

        var clientUrl = _config["ClientUrl"];
        return $"{clientUrl}/pay/{invoice.Id}?client_secret={intent.ClientSecret}";
    }

    public async Task<object> GetStatsSummaryAsync()
    {
        var total = await _context.Invoices.CountAsync();
        var paid = await _context.Invoices.CountAsync(x => x.Status == InvoiceStatus.Paid);
        var overdue = await _context.Invoices.CountAsync(x => x.Status == InvoiceStatus.Overdue);
        var revenue = await _context.Invoices.Where(x => x.Status == InvoiceStatus.Paid).SumAsync(x => x.TotalAmount);
        var outstanding = await _context.Invoices
            .Where(x => x.Status == InvoiceStatus.Sent || x.Status == InvoiceStatus.Overdue)
            .SumAsync(x => x.TotalAmount);

        return new { totalInvoices = total, totalRevenue = revenue, outstanding, overdue, paid };
    }

    public async Task<List<object>> GetMonthlyStatsAsync()
    {
        return await _invoiceRepo.GetMonthlyRevenueAsync(_tenantContext.TenantId);
    }

    private static InvoiceResponseDto MapToDto(CoreInvoice inv) => new()
    {
        Id = inv.Id,
        InvoiceNumber = inv.InvoiceNumber,
        TenantName = inv.Tenant?.Name,
        TenantLogoUrl = inv.Tenant?.LogoUrl,
        TenantPrimaryColor = inv.Tenant?.PrimaryColor,
        Status = inv.Status,
        IssueDate = inv.IssueDate,
        DueDate = inv.DueDate,
        SubTotal = inv.SubTotal,
        TaxAmount = inv.TaxAmount,
        TaxRate = inv.TaxRate,
        DiscountAmount = inv.DiscountAmount,
        TotalAmount = inv.TotalAmount,
        Notes = inv.Notes,
        PdfBlobUrl = inv.PdfBlobUrl,
        StripePaymentId = inv.StripePaymentId,
        PaidAt = inv.PaidAt,
        SentAt = inv.SentAt,
        CreatedAt = inv.CreatedAt,
        UpdatedAt = inv.UpdatedAt,
        ClientId = inv.ClientId,
        RowVersion = inv.RowVersion,
        Client = inv.Client == null ? null : new ClientResponseDto
        {
            Id = inv.Client.Id,
            Name = inv.Client.Name,
            Email = inv.Client.Email,
            Phone = inv.Client.Phone,
            Address = inv.Client.Address,
            City = inv.Client.City,
            Country = inv.Client.Country,
            IsActive = inv.Client.IsActive
        },
        LineItems = inv.LineItems?.Select(li => new InvoiceLineItemDto
        {
            Id = li.Id,
            Description = li.Description,
            Quantity = li.Quantity,
            UnitPrice = li.UnitPrice,
            Amount = li.Amount
        }).ToList() ?? new(),
        Payments = inv.Payments?.Select(p => new PaymentDto
        {
            Id = p.Id,
            Amount = p.Amount,
            Currency = p.Currency,
            StripePaymentIntentId = p.StripePaymentIntentId,
            Status = p.Status,
            PaidAt = p.PaidAt,
            PaymentMethod = p.PaymentMethod
        }).ToList() ?? new()
    };
}
