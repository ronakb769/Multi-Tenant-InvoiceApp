using InvoiceApp.Core.Constants;
using InvoiceApp.Core.DTOs.Common;
using InvoiceApp.Core.DTOs.Tenant;
using InvoiceApp.Core.DTOs.User;
using InvoiceApp.Core.Interfaces;
using InvoiceApp.Infrastructure.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;

namespace InvoiceApp.API.Controllers;

[ApiController]
[Route("api/v1/tenant")]
[Authorize]
[EnableRateLimiting("api")]
public class TenantController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly ITenantContext _tenantContext;

    public TenantController(AppDbContext context, ITenantContext tenantContext)
    {
        _context = context;
        _tenantContext = tenantContext;
    }

    [HttpGet("settings")]
    [Authorize(Roles = $"{Roles.TenantAdmin},{Roles.User}")]
    public async Task<ActionResult<ApiResponse<TenantSettingsResponseDto>>> GetSettings()
    {
        var tenant = await _context.Tenants.FindAsync(_tenantContext.TenantId);
        if (tenant == null)
            return NotFound(ApiResponse<TenantSettingsResponseDto>.Fail("Tenant not found."));

        var dto = new TenantSettingsResponseDto
        {
            Id = tenant.Id,
            Name = tenant.Name,
            Subdomain = tenant.Subdomain,
            Plan = tenant.Plan,
            LogoUrl = tenant.LogoUrl,
            PrimaryColor = tenant.PrimaryColor,
            MaxUsers = tenant.MaxUsers
        };
        return Ok(ApiResponse<TenantSettingsResponseDto>.Ok(dto));
    }

    [HttpPatch("settings/branding")]
    [Authorize(Roles = Roles.TenantAdmin)]
    public async Task<ActionResult<ApiResponse<TenantSettingsResponseDto>>> UpdateBranding([FromBody] UpdateTenantBrandingDto dto)
    {
        var tenant = await _context.Tenants.FindAsync(_tenantContext.TenantId);
        if (tenant == null)
            return NotFound(ApiResponse<TenantSettingsResponseDto>.Fail("Tenant not found."));

        if (dto.LogoUrl != null)
            tenant.LogoUrl = string.IsNullOrWhiteSpace(dto.LogoUrl) ? null : dto.LogoUrl;

        if (!string.IsNullOrWhiteSpace(dto.PrimaryColor))
            tenant.PrimaryColor = dto.PrimaryColor;

        await _context.SaveChangesAsync();

        var response = new TenantSettingsResponseDto
        {
            Id = tenant.Id,
            Name = tenant.Name,
            Subdomain = tenant.Subdomain,
            Plan = tenant.Plan,
            LogoUrl = tenant.LogoUrl,
            PrimaryColor = tenant.PrimaryColor,
            MaxUsers = tenant.MaxUsers
        };
        return Ok(ApiResponse<TenantSettingsResponseDto>.Ok(response, "Branding updated."));
    }

    [HttpGet("check-subdomain")]
    [AllowAnonymous]
    public async Task<ActionResult<ApiResponse<bool>>> CheckSubdomain([FromQuery] string subdomain)
    {
        var exists = await _context.Tenants.AnyAsync(t => t.Subdomain == subdomain.ToLowerInvariant());
        return Ok(ApiResponse<bool>.Ok(!exists, exists ? "Subdomain taken." : "Subdomain available."));
    }

    [HttpGet("users")]
    [Authorize(Roles = $"{Roles.TenantAdmin},{Roles.User}")]
    public async Task<ActionResult<ApiResponse<List<TenantUserResponseDto>>>> GetUsers()
    {
        var users = await _context.Users
            .Where(u => u.Role != Roles.SuperAdmin)
            .OrderBy(u => u.Name)
            .Select(u => new TenantUserResponseDto
            {
                Id = u.Id,
                Name = u.Name,
                Email = u.Email,
                Role = u.Role,
                IsActive = u.IsActive,
                CreatedAt = u.CreatedAt,
                LastLogin = u.LastLogin
            })
            .ToListAsync();

        return Ok(ApiResponse<List<TenantUserResponseDto>>.Ok(users));
    }

    [HttpPost("users")]
    [Authorize(Roles = Roles.TenantAdmin)]
    public async Task<ActionResult<ApiResponse<TenantUserResponseDto>>> CreateUser([FromBody] CreateTenantUserDto dto)
    {
        var emailTaken = await _context.Users.AnyAsync(u => u.Email == dto.Email.ToLowerInvariant());
        if (emailTaken)
            return Conflict(ApiResponse<TenantUserResponseDto>.Fail("Email is already in use."));

        var user = new InvoiceApp.Core.Entities.User
        {
            TenantId = _tenantContext.TenantId,
            Name = dto.Name,
            Email = dto.Email.ToLowerInvariant(),
            PasswordHash = global::BCrypt.Net.BCrypt.HashPassword(dto.Password, 12),
            Role = Roles.User,
            IsActive = true
        };

        _context.Users.Add(user);
        await _context.SaveChangesAsync();

        var response = new TenantUserResponseDto
        {
            Id = user.Id,
            Name = user.Name,
            Email = user.Email,
            Role = user.Role,
            IsActive = user.IsActive,
            CreatedAt = user.CreatedAt
        };

        return Ok(ApiResponse<TenantUserResponseDto>.Ok(response, "User created successfully."));
    }

    [HttpPatch("users/{id}/status")]
    [Authorize(Roles = Roles.TenantAdmin)]
    public async Task<ActionResult<ApiResponse<TenantUserResponseDto>>> ToggleUserStatus(Guid id)
    {
        var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == id)
            ?? throw new KeyNotFoundException($"User {id} not found.");

        if (user.Role == Roles.TenantAdmin && user.Id == _tenantContext.UserId)
            return BadRequest(ApiResponse<TenantUserResponseDto>.Fail("Cannot deactivate your own account."));

        user.IsActive = !user.IsActive;
        await _context.SaveChangesAsync();

        var response = new TenantUserResponseDto
        {
            Id = user.Id,
            Name = user.Name,
            Email = user.Email,
            Role = user.Role,
            IsActive = user.IsActive,
            CreatedAt = user.CreatedAt,
            LastLogin = user.LastLogin
        };

        return Ok(ApiResponse<TenantUserResponseDto>.Ok(response));
    }
}
