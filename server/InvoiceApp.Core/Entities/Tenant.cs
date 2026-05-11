namespace InvoiceApp.Core.Entities;

public class Tenant : BaseEntity
{
    public string Name { get; set; } = string.Empty;
    public string Subdomain { get; set; } = string.Empty;
    public string Plan { get; set; } = "Free";
    public bool IsActive { get; set; } = true;
    public string? LogoUrl { get; set; }
    public string PrimaryColor { get; set; } = "#1d3557";
    public int MaxUsers { get; set; } = 5;
    public ICollection<User> Users { get; set; } = new List<User>();
    public ICollection<Client> Clients { get; set; } = new List<Client>();
    public ICollection<Invoice> Invoices { get; set; } = new List<Invoice>();
}
