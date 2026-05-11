using InvoiceApp.Core.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace InvoiceApp.Infrastructure.Data.Configurations;

public class InvoiceConfiguration : IEntityTypeConfiguration<Invoice>
{
    public void Configure(EntityTypeBuilder<Invoice> builder)
    {
        builder.HasKey(x => x.Id);
        builder.Property(x => x.InvoiceNumber).IsRequired().HasMaxLength(50);
        builder.Property(x => x.Status).IsRequired().HasMaxLength(50).HasDefaultValue("Draft");
        builder.Property(x => x.SubTotal).HasColumnType("decimal(18,2)");
        builder.Property(x => x.TaxAmount).HasColumnType("decimal(18,2)");
        builder.Property(x => x.TaxRate).HasColumnType("decimal(5,2)");
        builder.Property(x => x.DiscountAmount).HasColumnType("decimal(18,2)");
        builder.Property(x => x.TotalAmount).HasColumnType("decimal(18,2)");
        builder.Property(x => x.Notes).HasMaxLength(2000);
        builder.Property(x => x.PdfBlobUrl).HasMaxLength(500);
        builder.Property(x => x.StripePaymentId).HasMaxLength(200);
        builder.Property(x => x.RowVersion).IsRowVersion();
        builder.HasOne(x => x.Tenant)
            .WithMany(x => x.Invoices)
            .HasForeignKey(x => x.TenantId)
            .OnDelete(DeleteBehavior.Restrict);
        builder.HasOne(x => x.Client)
            .WithMany(x => x.Invoices)
            .HasForeignKey(x => x.ClientId)
            .OnDelete(DeleteBehavior.Restrict);
        builder.HasMany(x => x.LineItems)
            .WithOne(x => x.Invoice)
            .HasForeignKey(x => x.InvoiceId)
            .OnDelete(DeleteBehavior.Cascade);
        builder.HasMany(x => x.Payments)
            .WithOne(x => x.Invoice)
            .HasForeignKey(x => x.InvoiceId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
