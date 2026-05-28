using InvoiceApp.Core.Constants;
using InvoiceApp.Core.DTOs.Common;
using InvoiceApp.Core.DTOs.Invoice;
using InvoiceApp.Core.Interfaces.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace InvoiceApp.API.Controllers;

[ApiController]
[Route("api/v1/invoices")]
[Authorize(Roles = $"{Roles.TenantAdmin},{Roles.User}")]
[EnableRateLimiting("api")]
public class InvoiceController : ControllerBase
{
    private readonly IInvoiceService _invoiceService;

    public InvoiceController(IInvoiceService invoiceService)
    {
        _invoiceService = invoiceService;
    }

    [HttpGet]
    public async Task<ActionResult<ApiResponse<PagedResult<InvoiceResponseDto>>>> GetAll(
        [FromQuery] string? status,
        [FromQuery] Guid? clientId,
        [FromQuery] string? search,
        [FromQuery] int page = 1,
        [FromQuery] int limit = 10,
        [FromQuery] string? sort = null,
        [FromQuery] DateTime? dateFrom = null,
        [FromQuery] DateTime? dateTo = null)
    {
        var pagination = new PaginationParams { Page = page, Limit = limit };
        var result = await _invoiceService.GetAllAsync(pagination, status, clientId, search, sort, dateFrom, dateTo);
        return Ok(ApiResponse<PagedResult<InvoiceResponseDto>>.Ok(result));
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<ApiResponse<InvoiceResponseDto>>> GetById(Guid id)
    {
        var result = await _invoiceService.GetByIdAsync(id);
        return Ok(ApiResponse<InvoiceResponseDto>.Ok(result));
    }

    [HttpPost]
    public async Task<ActionResult<ApiResponse<InvoiceResponseDto>>> Create([FromBody] CreateInvoiceDto dto)
    {
        var result = await _invoiceService.CreateAsync(dto);
        return CreatedAtAction(nameof(GetById), new { id = result.Id },
            ApiResponse<InvoiceResponseDto>.Ok(result, "Invoice created."));
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<ApiResponse<InvoiceResponseDto>>> Update(Guid id, [FromBody] UpdateInvoiceDto dto)
    {
        var result = await _invoiceService.UpdateAsync(id, dto);
        return Ok(ApiResponse<InvoiceResponseDto>.Ok(result, "Invoice updated."));
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = Roles.TenantAdmin)]
    public async Task<ActionResult<ApiResponse<object>>> Delete(Guid id)
    {
        await _invoiceService.DeleteAsync(id);
        return Ok(ApiResponse<object>.Ok(null!, "Invoice deleted."));
    }

    [HttpPatch("{id}/send")]
    public async Task<ActionResult<ApiResponse<InvoiceResponseDto>>> Send(Guid id)
    {
        var result = await _invoiceService.SendAsync(id);
        return Ok(ApiResponse<InvoiceResponseDto>.Ok(result, "Invoice sent."));
    }

    [HttpPatch("{id}/cancel")]
    [Authorize(Roles = Roles.TenantAdmin)]
    public async Task<ActionResult<ApiResponse<InvoiceResponseDto>>> Cancel(Guid id)
    {
        var result = await _invoiceService.CancelAsync(id);
        return Ok(ApiResponse<InvoiceResponseDto>.Ok(result, "Invoice cancelled."));
    }

    [HttpGet("{id}/pdf")]
    public async Task<IActionResult> GetPdf(Guid id)
    {
        var pdfBytes = await _invoiceService.GetPdfAsync(id);
        return File(pdfBytes, "application/pdf", $"invoice-{id}.pdf");
    }

    [HttpPost("{id}/payment-link")]
    public async Task<ActionResult<ApiResponse<string>>> CreatePaymentLink(Guid id)
    {
        var url = await _invoiceService.CreatePaymentLinkAsync(id);
        return Ok(ApiResponse<string>.Ok(url, "Payment link created."));
    }

    [HttpGet("stats/summary")]
    [Authorize(Roles = Roles.TenantAdmin)]
    public async Task<ActionResult<ApiResponse<object>>> GetStatsSummary()
    {
        var result = await _invoiceService.GetStatsSummaryAsync();
        return Ok(ApiResponse<object>.Ok(result));
    }

    [HttpGet("stats/monthly")]
    [Authorize(Roles = Roles.TenantAdmin)]
    public async Task<ActionResult<ApiResponse<List<object>>>> GetMonthlyStats()
    {
        var result = await _invoiceService.GetMonthlyStatsAsync();
        return Ok(ApiResponse<List<object>>.Ok(result));
    }
}
