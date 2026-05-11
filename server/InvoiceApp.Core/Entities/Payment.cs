namespace InvoiceApp.Core.Entities;

public class Payment : BaseEntity
{
    public Guid TenantId { get; set; }
    public Guid InvoiceId { get; set; }
    public Invoice Invoice { get; set; } = null!;
    public decimal Amount { get; set; }
    public string Currency { get; set; } = "USD";
    public string? StripePaymentIntentId { get; set; }
    public string? StripeChargeId { get; set; }
    public string Status { get; set; } = "Pending";
    public DateTime? PaidAt { get; set; }
    public string? PaymentMethod { get; set; }
}
