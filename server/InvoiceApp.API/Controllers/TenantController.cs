using InvoiceApp.Core.Constants;
using InvoiceApp.Core.DTOs.Common;
using InvoiceApp.Core.DTOs.User;
using InvoiceApp.Core.Interfaces;
using InvoiceApp.Infrastructure.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace InvoiceApp.API.Controllers;

[ApiController]
[Route("api/v1/tenant")]
[Authorize]
public class TenantController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly ITenantContext _tenantContext;

    public TenantController(AppDbContext context, ITenantContext tenantContext)
    {
        _context = context;
        _tenantContext = tenantContext;
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
