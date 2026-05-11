using InvoiceApp.Core.Constants;
using InvoiceApp.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace InvoiceApp.Infrastructure.BackgroundJobs;

public class OverdueInvoiceJob
{
    private readonly AppDbContext _context;
    private readonly ILogger<OverdueInvoiceJob> _logger;

    public OverdueInvoiceJob(AppDbContext context, ILogger<OverdueInvoiceJob> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task ExecuteAsync()
    {
        _logger.LogInformation("Running overdue invoice check at {Time}", DateTime.UtcNow);

        var overdueInvoices = await _context.Invoices
            .IgnoreQueryFilters()
            .Where(x => x.Status == InvoiceStatus.Sent && x.DueDate.Date < DateTime.UtcNow.Date)
            .ToListAsync();

        foreach (var invoice in overdueInvoices)
            invoice.Status = InvoiceStatus.Overdue;

        if (overdueInvoices.Count > 0)
        {
            await _context.SaveChangesAsync();
            _logger.LogInformation("Marked {Count} invoices as overdue", overdueInvoices.Count);
        }
        else
        {
            _logger.LogInformation("No invoices to mark as overdue");
        }
    }
}
