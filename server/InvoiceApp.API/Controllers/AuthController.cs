using InvoiceApp.Core.DTOs.Auth;
using InvoiceApp.Core.DTOs.Common;
using InvoiceApp.Core.Interfaces;
using InvoiceApp.Core.Interfaces.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;

namespace InvoiceApp.API.Controllers;

[ApiController]
[Route("api/v1/auth")]
public class AuthController : ControllerBase
{
    private readonly IAuthService _authService;
    private readonly ITenantContext _tenantContext;
    private readonly IConfiguration _config;

    public AuthController(IAuthService authService, ITenantContext tenantContext, IConfiguration config)
    {
        _authService = authService;
        _tenantContext = tenantContext;
        _config = config;
    }

    [HttpPost("register")]
    public async Task<ActionResult<ApiResponse<AuthResponseDto>>> Register([FromBody] RegisterDto dto)
    {
        var result = await _authService.RegisterAsync(dto);
        SetRefreshTokenCookie(result.RefreshToken);
        result.RefreshToken = null;
        return Ok(ApiResponse<AuthResponseDto>.Ok(result, "Registration successful."));
    }

    [HttpPost("login")]
    public async Task<ActionResult<ApiResponse<AuthResponseDto>>> Login([FromBody] LoginDto dto)
    {
        var result = await _authService.LoginAsync(dto);
        SetRefreshTokenCookie(result.RefreshToken);
        result.RefreshToken = null;
        return Ok(ApiResponse<AuthResponseDto>.Ok(result, "Login successful."));
    }

    [HttpPost("refresh")]
    public async Task<ActionResult<ApiResponse<AuthResponseDto>>> Refresh()
    {
        var refreshToken = Request.Cookies["refreshToken"];
        if (string.IsNullOrEmpty(refreshToken))
            return Unauthorized(ApiResponse<object>.Fail("No refresh token provided."));

        var result = await _authService.RefreshTokenAsync(refreshToken);
        SetRefreshTokenCookie(result.RefreshToken);
        result.RefreshToken = null;
        return Ok(ApiResponse<AuthResponseDto>.Ok(result));
    }

    [Authorize]
    [HttpPost("logout")]
    public async Task<ActionResult<ApiResponse<object>>> Logout()
    {
        await _authService.LogoutAsync(_tenantContext.UserId);
        Response.Cookies.Delete("refreshToken");
        return Ok(ApiResponse<object>.Ok(null!, "Logged out successfully."));
    }

    [Authorize]
    [HttpGet("me")]
    public async Task<ActionResult<ApiResponse<AuthResponseDto>>> Me()
    {
        var result = await _authService.GetCurrentUserAsync(_tenantContext.UserId);
        return Ok(ApiResponse<AuthResponseDto>.Ok(result));
    }

    [Authorize]
    [HttpPut("me/profile")]
    public async Task<ActionResult<ApiResponse<object>>> UpdateProfile([FromBody] UpdateProfileDto dto)
    {
        await _authService.UpdateProfileAsync(_tenantContext.UserId, dto.Name, dto.LogoUrl);
        return Ok(ApiResponse<object>.Ok(null!, "Profile updated."));
    }

    [Authorize]
    [HttpPut("me/password")]
    public async Task<ActionResult<ApiResponse<object>>> ChangePassword([FromBody] ChangePasswordDto dto)
    {
        await _authService.ChangePasswordAsync(_tenantContext.UserId, dto.CurrentPassword, dto.NewPassword);
        return Ok(ApiResponse<object>.Ok(null!, "Password changed successfully."));
    }

    [HttpPost("forgot-password")]
    public async Task<ActionResult<ApiResponse<object>>> ForgotPassword([FromBody] ForgotPasswordDto dto)
    {
        var clientBaseUrl = _config["ClientApp:BaseUrl"] ?? "http://localhost:5173";
        await _authService.ForgotPasswordAsync(dto.Email, clientBaseUrl);
        // Always 200 — never reveal whether the email exists
        return Ok(ApiResponse<object>.Ok(null!, "If that email is registered, a reset link has been sent."));
    }

    [HttpPost("reset-password")]
    public async Task<ActionResult<ApiResponse<object>>> ResetPassword([FromBody] ResetPasswordDto dto)
    {
        await _authService.ResetPasswordAsync(dto);
        return Ok(ApiResponse<object>.Ok(null!, "Password has been reset successfully."));
    }

    private void SetRefreshTokenCookie(string? token)
    {
        if (token == null) return;
        Response.Cookies.Append("refreshToken", token, new CookieOptions
        {
            HttpOnly = true,
            Secure = true,
            SameSite = SameSiteMode.Strict,
            Expires = DateTimeOffset.UtcNow.AddDays(7)
        });
    }
}

public class UpdateProfileDto
{
    public string Name { get; set; } = string.Empty;
    public string? LogoUrl { get; set; }
}

public class ChangePasswordDto
{
    public string CurrentPassword { get; set; } = string.Empty;
    public string NewPassword { get; set; } = string.Empty;
}
