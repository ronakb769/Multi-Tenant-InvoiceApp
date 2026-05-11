namespace InvoiceApp.Core.DTOs.Dashboard;

public class DashboardStatsDto
{
    public int TotalClients { get; set; }
    public int TotalInvoices { get; set; }
    public decimal TotalRevenue { get; set; }
    public decimal OutstandingAmount { get; set; }
    public int OverdueCount { get; set; }
    public decimal PaidThisMonth { get; set; }
}
