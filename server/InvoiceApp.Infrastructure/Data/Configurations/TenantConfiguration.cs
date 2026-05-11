using InvoiceApp.Core.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace InvoiceApp.Infrastructure.Data.Configurations;

public class TenantConfiguration : IEntityTypeConfiguration<Tenant>
{
    public void Configure(EntityTypeBuilder<Tenant> builder)
    {
        builder.HasKey(x => x.Id);
        builder.Property(x => x.Name).IsRequired().HasMaxLength(200);
        builder.Property(x => x.Subdomain).IsRequired().HasMaxLength(100);
        builder.HasIndex(x => x.Subdomain).IsUnique();
        builder.Property(x => x.Plan).IsRequired().HasMaxLength(50).HasDefaultValue("Free");
        builder.Property(x => x.PrimaryColor).HasMaxLength(20).HasDefaultValue("#1d3557");
        builder.Property(x => x.LogoUrl).HasMaxLength(500);
        builder.Property(x => x.MaxUsers).HasDefaultValue(5);
    }
}
