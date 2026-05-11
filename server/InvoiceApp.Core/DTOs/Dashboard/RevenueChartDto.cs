namespace InvoiceApp.Core.DTOs.Dashboard;

public class RevenueChartDto
{
    public string Month { get; set; } = string.Empty;
    public decimal Revenue { get; set; }
    public int InvoiceCount { get; set; }
}
