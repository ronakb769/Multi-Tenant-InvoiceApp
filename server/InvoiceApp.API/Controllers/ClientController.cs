using InvoiceApp.Core.Constants;
using InvoiceApp.Core.DTOs.Client;
using InvoiceApp.Core.DTOs.Common;
using InvoiceApp.Core.DTOs.Invoice;
using InvoiceApp.Core.Interfaces.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace InvoiceApp.API.Controllers;

[ApiController]
[Route("api/v1/clients")]
[Authorize(Roles = $"{Roles.TenantAdmin},{Roles.User}")]
[EnableRateLimiting("api")]
public class ClientController : ControllerBase
{
    private readonly IClientService _clientService;

    public ClientController(IClientService clientService)
    {
        _clientService = clientService;
    }

    [HttpGet]
    public async Task<ActionResult<ApiResponse<PagedResult<ClientResponseDto>>>> GetAll(
        [FromQuery] string? search,
        [FromQuery] bool? isActive,
        [FromQuery] int page = 1,
        [FromQuery] int limit = 10)
    {
        var pagination = new PaginationParams { Page = page, Limit = limit };
        var result = await _clientService.GetAllAsync(pagination, search, isActive);
        return Ok(ApiResponse<PagedResult<ClientResponseDto>>.Ok(result));
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<ApiResponse<ClientResponseDto>>> GetById(Guid id)
    {
        var result = await _clientService.GetByIdAsync(id);
        return Ok(ApiResponse<ClientResponseDto>.Ok(result));
    }

    [HttpPost]
    [Authorize(Roles = Roles.TenantAdmin)]
    public async Task<ActionResult<ApiResponse<ClientResponseDto>>> Create([FromBody] CreateClientDto dto)
    {
        var result = await _clientService.CreateAsync(dto);
        return CreatedAtAction(nameof(GetById), new { id = result.Id },
            ApiResponse<ClientResponseDto>.Ok(result, "Client created."));
    }

    [HttpPut("{id}")]
    [Authorize(Roles = Roles.TenantAdmin)]
    public async Task<ActionResult<ApiResponse<ClientResponseDto>>> Update(Guid id, [FromBody] UpdateClientDto dto)
    {
        var result = await _clientService.UpdateAsync(id, dto);
        return Ok(ApiResponse<ClientResponseDto>.Ok(result, "Client updated."));
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = Roles.TenantAdmin)]
    public async Task<ActionResult<ApiResponse<object>>> Delete(Guid id)
    {
        await _clientService.DeleteAsync(id);
        return Ok(ApiResponse<object>.Ok(null!, "Client deactivated."));
    }

    [HttpGet("{id}/invoices")]
    public async Task<ActionResult<ApiResponse<PagedResult<InvoiceResponseDto>>>> GetClientInvoices(
        Guid id,
        [FromQuery] int page = 1,
        [FromQuery] int limit = 10)
    {
        var pagination = new PaginationParams { Page = page, Limit = limit };
        var result = await _clientService.GetClientInvoicesAsync(id, pagination);
        return Ok(ApiResponse<PagedResult<InvoiceResponseDto>>.Ok(result));
    }
}
