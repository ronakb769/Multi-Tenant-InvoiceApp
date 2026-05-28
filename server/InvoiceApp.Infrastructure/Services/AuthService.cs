using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using InvoiceApp.Core.Constants;
using InvoiceApp.Core.DTOs.Auth;
using InvoiceApp.Core.Entities;
using InvoiceApp.Core.Interfaces.Repositories;
using InvoiceApp.Core.Interfaces.Services;
using InvoiceApp.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using Microsoft.Extensions.Logging;

namespace InvoiceApp.Infrastructure.Services;

public class AuthService : IAuthService
{
    private readonly IUserRepository _userRepo;
    private readonly AppDbContext _context;
    private readonly IConfiguration _config;
    private readonly IEmailService _emailService;
    private readonly ILogger<AuthService> _logger;

    public AuthService(IUserRepository userRepo, AppDbContext context, IConfiguration config,
        IEmailService emailService, ILogger<AuthService> logger)
    {
        _userRepo = userRepo;
        _context = context;
        _config = config;
        _emailService = emailService;
        _logger = logger;
    }

    public async Task<AuthResponseDto> RegisterAsync(RegisterDto dto)
    {
        var subdomain = dto.Subdomain.ToLowerInvariant();

        if (await _context.Tenants.AnyAsync(t => t.Subdomain == subdomain))
            throw new InvalidOperationException("Subdomain is already taken.");

        if (await _userRepo.EmailExistsAsync(dto.Email))
            throw new InvalidOperationException("Email is already registered.");

        var tenant = new Tenant
        {
            Name = dto.TenantName,
            Subdomain = subdomain,
            Plan = "Free",
            MaxUsers = 5
        };
        _context.Tenants.Add(tenant);

        var user = new User
        {
            TenantId = tenant.Id,
            Name = dto.Name,
            Email = dto.Email,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.Password, 12),
            Role = Roles.TenantAdmin,
            IsActive = true
        };
        _context.Users.Add(user);
        await _context.SaveChangesAsync();

        return await GenerateAuthResponse(user, tenant);
    }

    public async Task<AuthResponseDto> LoginAsync(LoginDto dto)
    {
        var user = await _context.Users
            .IgnoreQueryFilters()
            .Include(u => u.Tenant)
            .FirstOrDefaultAsync(u => u.Email == dto.Email);

        if (user == null || !BCrypt.Net.BCrypt.Verify(dto.Password, user.PasswordHash))
            throw new UnauthorizedAccessException("Invalid email or password.");

        if (!user.IsActive)
            throw new UnauthorizedAccessException("Account is deactivated.");

        if (user.TenantId.HasValue && user.Tenant != null && !user.Tenant.IsActive)
            throw new UnauthorizedAccessException("Your organization account has been deactivated.");

        user.LastLogin = DateTime.UtcNow;
        var refreshToken = GenerateRefreshToken();
        user.RefreshToken = refreshToken;
        user.RefreshTokenExpiry = DateTime.UtcNow.AddDays(7);
        _context.Users.Update(user);
        await _context.SaveChangesAsync();

        return await GenerateAuthResponse(user, user.Tenant);
    }

    public async Task<AuthResponseDto> RefreshTokenAsync(string refreshToken)
    {
        var user = await _userRepo.GetByRefreshTokenAsync(refreshToken);

        if (user == null || user.RefreshTokenExpiry < DateTime.UtcNow)
            throw new UnauthorizedAccessException("Invalid or expired refresh token.");

        var tenant = user.TenantId.HasValue
            ? await _context.Tenants.FindAsync(user.TenantId.Value)
            : null;

        var newRefreshToken = GenerateRefreshToken();
        user.RefreshToken = newRefreshToken;
        user.RefreshTokenExpiry = DateTime.UtcNow.AddDays(7);
        _context.Users.Update(user);
        await _context.SaveChangesAsync();

        return await GenerateAuthResponse(user, tenant);
    }

    public async Task LogoutAsync(Guid userId)
    {
        var user = await _context.Users.IgnoreQueryFilters().FirstOrDefaultAsync(u => u.Id == userId);
        if (user != null)
        {
            user.RefreshToken = null;
            user.RefreshTokenExpiry = null;
            _context.Users.Update(user);
            await _context.SaveChangesAsync();
        }
    }

    public async Task<AuthResponseDto> GetCurrentUserAsync(Guid userId)
    {
        var user = await _context.Users
            .IgnoreQueryFilters()
            .Include(u => u.Tenant)
            .FirstOrDefaultAsync(u => u.Id == userId)
            ?? throw new KeyNotFoundException("User not found.");

        return await GenerateAuthResponse(user, user.Tenant, includeRefreshToken: false);
    }

    public async Task UpdateProfileAsync(Guid userId, string name, string? logoUrl)
    {
        var user = await _context.Users.IgnoreQueryFilters().FirstOrDefaultAsync(u => u.Id == userId)
            ?? throw new KeyNotFoundException("User not found.");

        user.Name = name;
        if (user.TenantId.HasValue && logoUrl != null)
        {
            var tenant = await _context.Tenants.FindAsync(user.TenantId.Value);
            if (tenant != null) tenant.LogoUrl = logoUrl;
        }
        await _context.SaveChangesAsync();
    }

    public async Task ChangePasswordAsync(Guid userId, string currentPassword, string newPassword)
    {
        var user = await _context.Users.IgnoreQueryFilters().FirstOrDefaultAsync(u => u.Id == userId)
            ?? throw new KeyNotFoundException("User not found.");

        if (!BCrypt.Net.BCrypt.Verify(currentPassword, user.PasswordHash))
            throw new InvalidOperationException("Current password is incorrect.");

        user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(newPassword, 12);
        await _context.SaveChangesAsync();
    }

    public async Task ForgotPasswordAsync(string email, string clientBaseUrl)
    {
        var user = await _context.Users
            .IgnoreQueryFilters()
            .FirstOrDefaultAsync(u => u.Email == email);

        // Always return success to prevent email enumeration
        if (user == null || !user.IsActive)
            return;

        var token = Convert.ToHexString(RandomNumberGenerator.GetBytes(32));
        user.PasswordResetToken = BCrypt.Net.BCrypt.HashPassword(token, 10);
        user.PasswordResetTokenExpiry = DateTime.UtcNow.AddHours(1);
        await _context.SaveChangesAsync();

        var resetLink = $"{clientBaseUrl}/reset-password?token={Uri.EscapeDataString(token)}&email={Uri.EscapeDataString(email)}";

        try
        {
            await _emailService.SendPasswordResetEmailAsync(user.Email, user.Name, resetLink);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send password reset email to {Email}", email);
        }
    }

    public async Task ResetPasswordAsync(ResetPasswordDto dto)
    {
        var user = await _context.Users

            .IgnoreQueryFilters()
            .FirstOrDefaultAsync(u => u.Email == dto.Email);

        if (user == null
            || user.PasswordResetToken == null
            || user.PasswordResetTokenExpiry == null
            || user.PasswordResetTokenExpiry < DateTime.UtcNow
            || !BCrypt.Net.BCrypt.Verify(dto.Token, user.PasswordResetToken))
        {
            throw new InvalidOperationException("Invalid or expired password reset token.");
        }

        user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.NewPassword, 12);
        user.PasswordResetToken = null;
        user.PasswordResetTokenExpiry = null;
        // Invalidate all sessions on password reset
        user.RefreshToken = null;
        user.RefreshTokenExpiry = null;
        await _context.SaveChangesAsync();
    }

    private Task<AuthResponseDto> GenerateAuthResponse(User user, Tenant? tenant, bool includeRefreshToken = true)
    {
        var accessToken = GenerateAccessToken(user, tenant);
        return Task.FromResult(new AuthResponseDto
        {
            AccessToken = accessToken,
            RefreshToken = includeRefreshToken ? user.RefreshToken : null,
            User = new UserDto
            {
                Id = user.Id,
                Name = user.Name,
                Email = user.Email,
                Role = user.Role,
                TenantId = user.TenantId,
                TenantName = tenant?.Name,
                TenantSubdomain = tenant?.Subdomain,
                TenantPlan = tenant?.Plan,
                LogoUrl = tenant?.LogoUrl,
                TenantPrimaryColor = tenant?.PrimaryColor
            }
        });
    }

    private string GenerateAccessToken(User user, Tenant? tenant)
    {
        var secret = _config["JwtSettings:Secret"]!;
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secret));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var claims = new List<Claim>
        {
            new(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
            new(JwtRegisteredClaimNames.Email, user.Email),
            new(ClaimTypes.Role, user.Role),
            new("name", user.Name),
            new(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString())
        };

        if (user.TenantId.HasValue)
            claims.Add(new Claim("tenantId", user.TenantId.Value.ToString()));

        var token = new JwtSecurityToken(
            issuer: _config["JwtSettings:Issuer"],
            audience: _config["JwtSettings:Audience"],
            claims: claims,
            expires: DateTime.UtcNow.AddMinutes(15),
            signingCredentials: creds
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    private static string GenerateRefreshToken()
    {
        var bytes = new byte[64];
        using var rng = RandomNumberGenerator.Create();
        rng.GetBytes(bytes);
        return Convert.ToBase64String(bytes);
    }
}
