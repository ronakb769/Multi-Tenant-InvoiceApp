namespace InvoiceApp.Core.DTOs.Auth;

public class RegisterDto
{
    public string Name { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
    public string TenantName { get; set; } = string.Empty;
    public string Subdomain { get; set; } = string.Empty;
}
