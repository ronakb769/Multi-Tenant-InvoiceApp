using InvoiceApp.Core.Constants;
using InvoiceApp.Core.DTOs.Common;
using InvoiceApp.Core.Interfaces.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace InvoiceApp.API.Controllers;

[ApiController]
[Route("api/v1/payments")]
[EnableRateLimiting("api")]
public class PaymentController : ControllerBase
{
    private readonly IPaymentService _paymentService;

    public PaymentController(IPaymentService paymentService)
    {
        _paymentService = paymentService;
    }

    [HttpGet]
    [Authorize(Roles = Roles.TenantAdmin)]
    public async Task<ActionResult<ApiResponse<PagedResult<object>>>> GetAll(
        [FromQuery] int page = 1,
        [FromQuery] int limit = 10)
    {
        var pagination = new PaginationParams { Page = page, Limit = limit };
        var result = await _paymentService.GetAllAsync(pagination);
        return Ok(ApiResponse<PagedResult<object>>.Ok(result));
    }

    [HttpGet("{invoiceId}")]
    [Authorize(Roles = $"{Roles.TenantAdmin},{Roles.User}")]
    public async Task<ActionResult<ApiResponse<List<object>>>> GetByInvoice(Guid invoiceId)
    {
        var result = await _paymentService.GetByInvoiceAsync(invoiceId);
        return Ok(ApiResponse<List<object>>.Ok(result));
    }
}
