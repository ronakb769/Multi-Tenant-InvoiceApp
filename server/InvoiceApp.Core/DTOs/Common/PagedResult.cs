namespace InvoiceApp.Core.DTOs.Common;

public class PagedResult<T>
{
    public List<T> Items { get; set; } = new();
    public int TotalCount { get; set; }
    public int Page { get; set; }
    public int Limit { get; set; }
    public int TotalPages => (int)Math.Ceiling((double)TotalCount / Limit);
    public bool HasNext => Page < TotalPages;
    public bool HasPrev => Page > 1;
}
