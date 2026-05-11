using InvoiceApp.Core.Constants;
using InvoiceApp.Core.DTOs.Common;
using InvoiceApp.Infrastructure.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace InvoiceApp.API.Controllers;

[ApiController]
[Route("api/v1/users")]
[Authorize(Roles = Roles.TenantAdmin)]
public class UserController : ControllerBase
{
    private readonly AppDbContext _context;

    public UserController(AppDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<ActionResult<ApiResponse<List<object>>>> GetUsers()
    {
        var users = await _context.Users
            .Select(u => (object)new
            {
                u.Id,
                u.Name,
                u.Email,
                u.Role,
                u.IsActive,
                u.LastLogin,
                u.CreatedAt
            })
            .ToListAsync();

        return Ok(ApiResponse<List<object>>.Ok(users));
    }

    [HttpPatch("{id}/status")]
    public async Task<ActionResult<ApiResponse<object>>> ToggleStatus(Guid id, [FromBody] ToggleStatusDto dto)
    {
        var user = await _context.Users.FindAsync(id)
            ?? throw new KeyNotFoundException("User not found.");
        user.IsActive = dto.IsActive;
        await _context.SaveChangesAsync();
        return Ok(ApiResponse<object>.Ok(null!, "User status updated."));
    }
}

public class ToggleStatusDto { public bool IsActive { get; set; } }
