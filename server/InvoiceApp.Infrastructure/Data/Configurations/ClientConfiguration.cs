using InvoiceApp.Core.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace InvoiceApp.Infrastructure.Data.Configurations;

public class ClientConfiguration : IEntityTypeConfiguration<Client>
{
    public void Configure(EntityTypeBuilder<Client> builder)
    {
        builder.HasKey(x => x.Id);
        builder.Property(x => x.Name).IsRequired().HasMaxLength(200);
        builder.Property(x => x.Email).IsRequired().HasMaxLength(200);
        builder.Property(x => x.Phone).HasMaxLength(50);
        builder.Property(x => x.Address).HasMaxLength(500);
        builder.Property(x => x.City).HasMaxLength(100);
        builder.Property(x => x.Country).HasMaxLength(100);
        builder.Property(x => x.TaxNumber).HasMaxLength(50);
        builder.HasIndex(x => new { x.TenantId, x.Email }).IsUnique();
        builder.HasOne(x => x.Tenant)
            .WithMany(x => x.Clients)
            .HasForeignKey(x => x.TenantId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
