using InvoiceApp.Core.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace InvoiceApp.Infrastructure.Data.Configurations;

public class UserConfiguration : IEntityTypeConfiguration<User>
{
    public void Configure(EntityTypeBuilder<User> builder)
    {
        builder.HasKey(x => x.Id);
        builder.Property(x => x.Name).IsRequired().HasMaxLength(200);
        builder.Property(x => x.Email).IsRequired().HasMaxLength(200);
        builder.Property(x => x.PasswordHash).IsRequired().HasMaxLength(500);
        builder.Property(x => x.Role).IsRequired().HasMaxLength(50);
        builder.Property(x => x.RefreshToken).HasMaxLength(500);
        builder.HasIndex(x => new { x.TenantId, x.Email }).IsUnique();
        builder.Property(x => x.RowVersion).IsRowVersion();
        builder.HasOne(x => x.Tenant)
            .WithMany(x => x.Users)
            .HasForeignKey(x => x.TenantId)
            .OnDelete(DeleteBehavior.Restrict)
            .IsRequired(false);
    }
}
