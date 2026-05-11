using InvoiceApp.Core.Entities;
using InvoiceApp.Core.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace InvoiceApp.Infrastructure.Data;

public class AppDbContext : DbContext
{
    private readonly ITenantContext _tenantContext;

    public AppDbContext(DbContextOptions<AppDbContext> options, ITenantContext tenantContext)
        : base(options)
    {
        _tenantContext = tenantContext;
    }

    public DbSet<Tenant> Tenants => Set<Tenant>();
    public DbSet<User> Users => Set<User>();
    public DbSet<Client> Clients => Set<Client>();
    public DbSet<Invoice> Invoices => Set<Invoice>();
    public DbSet<InvoiceLineItem> InvoiceLineItems => Set<InvoiceLineItem>();
    public DbSet<Payment> Payments => Set<Payment>();
    public DbSet<TaxRate> TaxRates => Set<TaxRate>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(AppDbContext).Assembly);

        // Global query filters for multi-tenancy
        modelBuilder.Entity<Client>().HasQueryFilter(x =>
            _tenantContext.IsSuperAdmin || x.TenantId == _tenantContext.TenantId);

        modelBuilder.Entity<Invoice>().HasQueryFilter(x =>
            _tenantContext.IsSuperAdmin || x.TenantId == _tenantContext.TenantId);

        modelBuilder.Entity<Payment>().HasQueryFilter(x =>
            _tenantContext.IsSuperAdmin || x.TenantId == _tenantContext.TenantId);

        modelBuilder.Entity<User>().HasQueryFilter(x =>
            _tenantContext.IsSuperAdmin || x.TenantId == _tenantContext.TenantId);

        modelBuilder.Entity<TaxRate>().HasQueryFilter(x =>
            _tenantContext.IsSuperAdmin || x.TenantId == _tenantContext.TenantId);
    }

    public override async Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        foreach (var entry in ChangeTracker.Entries<BaseEntity>())
        {
            switch (entry.State)
            {
                case EntityState.Added:
                    entry.Entity.CreatedAt = DateTime.UtcNow;
                    entry.Entity.UpdatedAt = DateTime.UtcNow;
                    SetTenantId(entry);
                    break;
                case EntityState.Modified:
                    entry.Entity.UpdatedAt = DateTime.UtcNow;
                    break;
            }
        }

        try
        {
            return await base.SaveChangesAsync(cancellationToken);
        }
        catch (DbUpdateConcurrencyException)
        {
            throw new InvalidOperationException("Record was modified by another user, please refresh and try again.");
        }
    }

    private void SetTenantId(Microsoft.EntityFrameworkCore.ChangeTracking.EntityEntry<BaseEntity> entry)
    {
        var tenantIdProp = entry.Entity.GetType().GetProperty("TenantId");
        if (tenantIdProp != null && tenantIdProp.PropertyType == typeof(Guid))
        {
            var currentValue = (Guid)tenantIdProp.GetValue(entry.Entity)!;
            if (currentValue == Guid.Empty && _tenantContext.TenantId != Guid.Empty)
            {
                tenantIdProp.SetValue(entry.Entity, _tenantContext.TenantId);
            }
        }
    }
}
