using InvoiceApp.Core.DTOs.Client;
using InvoiceApp.Core.DTOs.Common;
using InvoiceApp.Core.DTOs.Invoice;

namespace InvoiceApp.Core.Interfaces.Services;

public interface IClientService
{
    Task<PagedResult<ClientResponseDto>> GetAllAsync(PaginationParams pagination, string? search = null, bool? isActive = null);
    Task<ClientResponseDto> GetByIdAsync(Guid id);
    Task<ClientResponseDto> CreateAsync(CreateClientDto dto);
    Task<ClientResponseDto> UpdateAsync(Guid id, UpdateClientDto dto);
    Task DeleteAsync(Guid id);
    Task<PagedResult<InvoiceResponseDto>> GetClientInvoicesAsync(Guid clientId, PaginationParams pagination);
}
