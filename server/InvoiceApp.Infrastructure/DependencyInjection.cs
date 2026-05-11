using InvoiceApp.Core.Interfaces;
using InvoiceApp.Core.Interfaces.Repositories;
using InvoiceApp.Core.Interfaces.Services;
using InvoiceApp.Infrastructure.BackgroundJobs;
using InvoiceApp.Infrastructure.Data;
using InvoiceApp.Infrastructure.Repositories;
using InvoiceApp.Infrastructure.Services;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace InvoiceApp.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(this IServiceCollection services, IConfiguration config)
    {
        services.AddDbContext<AppDbContext>(options =>
            options.UseSqlServer(config.GetConnectionString("DefaultConnection"),
                b => b.MigrationsAssembly(typeof(AppDbContext).Assembly.FullName)));

        // Tenant context (scoped per request)
        services.AddScoped<ITenantContext, TenantContext>();

        // Repositories
        services.AddScoped(typeof(IGenericRepository<>), typeof(GenericRepository<>));
        services.AddScoped<IInvoiceRepository, InvoiceRepository>();
        services.AddScoped<IClientRepository, ClientRepository>();
        services.AddScoped<IUserRepository, UserRepository>();

        // Services
        services.AddScoped<IAuthService, AuthService>();
        services.AddScoped<IInvoiceService, InvoiceService>();
        services.AddScoped<IClientService, ClientService>();
        services.AddScoped<IPaymentService, PaymentService>();
        services.AddScoped<IPdfService, PdfService>();
        services.AddScoped<IEmailService, EmailService>();
        services.AddScoped<IDashboardService, DashboardService>();

        // Background jobs
        services.AddScoped<OverdueInvoiceJob>();

        return services;
    }
}
