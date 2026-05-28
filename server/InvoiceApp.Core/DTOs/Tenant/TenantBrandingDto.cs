namespace InvoiceApp.Core.DTOs.Tenant;

public class TenantSettingsResponseDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Subdomain { get; set; } = string.Empty;
    public string Plan { get; set; } = string.Empty;
    public string? LogoUrl { get; set; }
    public string PrimaryColor { get; set; } = "#1d3557";
    public int MaxUsers { get; set; }
}

public class UpdateTenantBrandingDto
{
    public string? LogoUrl { get; set; }
    public string? PrimaryColor { get; set; }
}
