using InvoiceApp.Core.DTOs.Common;
using InvoiceApp.Core.DTOs.Invoice;

namespace InvoiceApp.Core.Interfaces.Services;

public interface IInvoiceService
{
    Task<PagedResult<InvoiceResponseDto>> GetAllAsync(PaginationParams pagination, string? status = null, Guid? clientId = null, string? search = null, string? sort = null, DateTime? dateFrom = null, DateTime? dateTo = null);
    Task<InvoiceResponseDto> GetByIdAsync(Guid id);
    Task<InvoiceResponseDto> CreateAsync(CreateInvoiceDto dto);
    Task<InvoiceResponseDto> UpdateAsync(Guid id, UpdateInvoiceDto dto);
    Task DeleteAsync(Guid id);
    Task<InvoiceResponseDto> SendAsync(Guid id);
    Task<InvoiceResponseDto> CancelAsync(Guid id);
    Task<byte[]> GetPdfAsync(Guid id);
    Task<string> CreatePaymentLinkAsync(Guid id);
    Task<object> GetStatsSummaryAsync();
    Task<List<object>> GetMonthlyStatsAsync();
}
