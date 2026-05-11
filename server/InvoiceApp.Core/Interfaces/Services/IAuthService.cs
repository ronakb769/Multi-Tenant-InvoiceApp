using InvoiceApp.Core.DTOs.Auth;

namespace InvoiceApp.Core.Interfaces.Services;

public interface IAuthService
{
    Task<AuthResponseDto> RegisterAsync(RegisterDto dto);
    Task<AuthResponseDto> LoginAsync(LoginDto dto);
    Task<AuthResponseDto> RefreshTokenAsync(string refreshToken);
    Task LogoutAsync(Guid userId);
    Task<AuthResponseDto> GetCurrentUserAsync(Guid userId);
    Task UpdateProfileAsync(Guid userId, string name, string? logoUrl);
    Task ChangePasswordAsync(Guid userId, string currentPassword, string newPassword);
}
