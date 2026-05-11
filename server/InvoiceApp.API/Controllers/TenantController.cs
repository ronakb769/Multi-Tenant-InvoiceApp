using InvoiceApp.Core.DTOs.Common;
using InvoiceApp.Infrastructure.Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace InvoiceApp.API.Controllers;

[ApiController]
[Route("api/v1/tenant")]
public class TenantController : ControllerBase
{
    private readonly AppDbContext _context;

    public TenantController(AppDbContext context)
    {
        _context = context;
    }

    [HttpGet("check-subdomain")]
    public async Task<ActionResult<ApiResponse<bool>>> CheckSubdomain([FromQuery] string subdomain)
    {
        var exists = await _context.Tenants.AnyAsync(t => t.Subdomain == subdomain.ToLowerInvariant());
        return Ok(ApiResponse<bool>.Ok(!exists, exists ? "Subdomain taken." : "Subdomain available."));
    }
}
