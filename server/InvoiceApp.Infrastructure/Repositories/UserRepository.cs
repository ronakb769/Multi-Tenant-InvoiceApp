using InvoiceApp.Core.Entities;
using InvoiceApp.Core.Interfaces.Repositories;
using InvoiceApp.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace InvoiceApp.Infrastructure.Repositories;

public class UserRepository : GenericRepository<User>, IUserRepository
{
    public UserRepository(AppDbContext context) : base(context) { }

    public async Task<User?> GetByEmailAsync(string email, Guid? tenantId = null)
    {
        var query = _context.Users.AsQueryable();
        if (tenantId.HasValue)
            query = query.Where(x => x.TenantId == tenantId.Value);
        return await query.FirstOrDefaultAsync(x => x.Email == email);
    }

    public async Task<User?> GetByRefreshTokenAsync(string refreshToken)
    {
        return await _context.Users
            .IgnoreQueryFilters()
            .FirstOrDefaultAsync(x => x.RefreshToken == refreshToken);
    }

    public async Task<bool> EmailExistsAsync(string email, Guid? tenantId = null)
    {
        var query = _context.Users.AsQueryable();
        if (tenantId.HasValue)
            query = query.Where(x => x.TenantId == tenantId.Value);
        return await query.AnyAsync(x => x.Email == email);
    }
}
