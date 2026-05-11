using InvoiceApp.Core.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace InvoiceApp.Infrastructure.Data.Configurations;

public class PaymentConfiguration : IEntityTypeConfiguration<Payment>
{
    public void Configure(EntityTypeBuilder<Payment> builder)
    {
        builder.HasKey(x => x.Id);
        builder.Property(x => x.Amount).HasColumnType("decimal(18,2)");
        builder.Property(x => x.Currency).HasMaxLength(10).HasDefaultValue("USD");
        builder.Property(x => x.StripePaymentIntentId).HasMaxLength(200);
        builder.Property(x => x.StripeChargeId).HasMaxLength(200);
        builder.Property(x => x.Status).IsRequired().HasMaxLength(50).HasDefaultValue("Pending");
        builder.Property(x => x.PaymentMethod).HasMaxLength(100);
    }
}
