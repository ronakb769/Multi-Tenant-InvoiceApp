namespace InvoiceApp.Core.DTOs.Common;

public class PaginationParams
{
    private int _limit = 10;
    public int Page { get; set; } = 1;
    public int Limit
    {
        get => _limit;
        set => _limit = value > 100 ? 100 : value < 1 ? 1 : value;
    }
}
