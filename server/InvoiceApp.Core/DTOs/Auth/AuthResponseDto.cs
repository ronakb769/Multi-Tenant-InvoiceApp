namespace InvoiceApp.Core.DTOs.Auth;

public class AuthResponseDto
{
    public string AccessToken { get; set; } = string.Empty;
    public string? RefreshToken { get; set; }
    public UserDto User { get; set; } = null!;
}

public class UserDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Role { get; set; } = string.Empty;
    public Guid? TenantId { get; set; }
    public string? TenantName { get; set; }
    public string? TenantSubdomain { get; set; }
    public string? TenantPlan { get; set; }
    public string? LogoUrl { get; set; }
}
