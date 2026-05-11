using InvoiceApp.Core.Entities;

namespace InvoiceApp.Core.Interfaces.Repositories;

public interface IUserRepository : IGenericRepository<User>
{
    Task<User?> GetByEmailAsync(string email, Guid? tenantId = null);
    Task<User?> GetByRefreshTokenAsync(string refreshToken);
    Task<bool> EmailExistsAsync(string email, Guid? tenantId = null);
}
