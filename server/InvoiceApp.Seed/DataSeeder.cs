using InvoiceApp.Core.Constants;
using InvoiceApp.Core.Entities;
using InvoiceApp.Infrastructure.Data;
using InvoiceApp.Infrastructure.Services;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

var config = new ConfigurationBuilder()
    .SetBasePath(Directory.GetCurrentDirectory())
    .AddJsonFile("appsettings.Development.json", optional: false)
    .Build();

var services = new ServiceCollection();
var tenantContext = new TenantContext { UserRole = Roles.SuperAdmin };
services.AddSingleton<InvoiceApp.Core.Interfaces.ITenantContext>(tenantContext);
services.AddDbContext<AppDbContext>(options =>
    options.UseSqlServer(config.GetConnectionString("DefaultConnection")));

var provider = services.BuildServiceProvider();

using var scope = provider.CreateScope();
var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

Console.WriteLine("Dropping and recreating database...");
await db.Database.EnsureDeletedAsync();
await db.Database.MigrateAsync();

Console.WriteLine("Seeding tenants...");
var techCorpId = Guid.NewGuid();
var creativeStudioId = Guid.NewGuid();

var techCorp = new Tenant
{
    Id = techCorpId,
    Name = "TechCorp Solutions",
    Subdomain = "techcorp",
    Plan = "Pro",
    MaxUsers = 20,
    IsActive = true,
    PrimaryColor = "#1d3557"
};

var creativeStudio = new Tenant
{
    Id = creativeStudioId,
    Name = "Creative Studio",
    Subdomain = "creativestudio",
    Plan = "Free",
    MaxUsers = 5,
    IsActive = true,
    PrimaryColor = "#e63946"
};

db.Tenants.AddRange(techCorp, creativeStudio);

Console.WriteLine("Seeding users...");
var superAdmin = new User
{
    Id = Guid.NewGuid(),
    TenantId = null,
    Name = "Super Admin",
    Email = "superadmin@invoiceapp.com",
    PasswordHash = BCrypt.Net.BCrypt.HashPassword("SuperAdmin@1234", 12),
    Role = Roles.SuperAdmin,
    IsActive = true
};

var techAdmin = new User
{
    Id = Guid.NewGuid(),
    TenantId = techCorpId,
    Name = "TechCorp Admin",
    Email = "admin@techcorp.com",
    PasswordHash = BCrypt.Net.BCrypt.HashPassword("Admin@1234", 12),
    Role = Roles.TenantAdmin,
    IsActive = true
};

var techUser1 = new User
{
    Id = Guid.NewGuid(),
    TenantId = techCorpId,
    Name = "TechCorp User1",
    Email = "user1@techcorp.com",
    PasswordHash = BCrypt.Net.BCrypt.HashPassword("User@1234", 12),
    Role = Roles.User,
    IsActive = true
};

var techUser2 = new User
{
    Id = Guid.NewGuid(),
    TenantId = techCorpId,
    Name = "TechCorp User2",
    Email = "user2@techcorp.com",
    PasswordHash = BCrypt.Net.BCrypt.HashPassword("User@1234", 12),
    Role = Roles.User,
    IsActive = true
};

var creativeAdmin = new User
{
    Id = Guid.NewGuid(),
    TenantId = creativeStudioId,
    Name = "Creative Admin",
    Email = "admin@creativestudio.com",
    PasswordHash = BCrypt.Net.BCrypt.HashPassword("Admin@1234", 12),
    Role = Roles.TenantAdmin,
    IsActive = true
};

var creativeUser1 = new User
{
    Id = Guid.NewGuid(),
    TenantId = creativeStudioId,
    Name = "Creative User1",
    Email = "user1@creativestudio.com",
    PasswordHash = BCrypt.Net.BCrypt.HashPassword("User@1234", 12),
    Role = Roles.User,
    IsActive = true
};

db.Users.AddRange(superAdmin, techAdmin, techUser1, techUser2, creativeAdmin, creativeUser1);

Console.WriteLine("Seeding clients...");
// TechCorp clients
var tcClients = new[]
{
    new Client { Id = Guid.NewGuid(), TenantId = techCorpId, Name = "Acme Corporation", Email = "billing@acmecorp.com", Phone = "+1-555-0101", Address = "123 Business Ave", City = "New York", Country = "USA", IsActive = true },
    new Client { Id = Guid.NewGuid(), TenantId = techCorpId, Name = "Global Tech Ltd", Email = "accounts@globaltech.io", Phone = "+1-555-0102", Address = "456 Innovation Drive", City = "San Francisco", Country = "USA", IsActive = true },
    new Client { Id = Guid.NewGuid(), TenantId = techCorpId, Name = "Summit Enterprises", Email = "finance@summit.co", Phone = "+1-555-0103", Address = "789 Peak Street", City = "Chicago", Country = "USA", IsActive = true },
    new Client { Id = Guid.NewGuid(), TenantId = techCorpId, Name = "BlueSky Analytics", Email = "pay@bluesky.ai", Phone = "+1-555-0104", Address = "321 Cloud Blvd", City = "Seattle", Country = "USA", IsActive = true },
    new Client { Id = Guid.NewGuid(), TenantId = techCorpId, Name = "Nexus Digital", Email = "ap@nexusdigital.com", Phone = "+1-555-0105", Address = "654 Digital Lane", City = "Austin", Country = "USA", IsActive = false }
};

// Creative Studio clients
var csClients = new[]
{
    new Client { Id = Guid.NewGuid(), TenantId = creativeStudioId, Name = "Design Masters Inc", Email = "billing@designmasters.com", Phone = "+44-20-0001", Address = "10 Art Street", City = "London", Country = "UK", IsActive = true },
    new Client { Id = Guid.NewGuid(), TenantId = creativeStudioId, Name = "Brand Architects", Email = "accounts@brandarch.co.uk", Phone = "+44-20-0002", Address = "22 Brand Avenue", City = "Manchester", Country = "UK", IsActive = true },
    new Client { Id = Guid.NewGuid(), TenantId = creativeStudioId, Name = "Pixel Perfect Studio", Email = "pay@pixelperfect.io", Phone = "+44-20-0003", Address = "33 Pixel Road", City = "Birmingham", Country = "UK", IsActive = true },
    new Client { Id = Guid.NewGuid(), TenantId = creativeStudioId, Name = "Motion Media Group", Email = "finance@motionmedia.com", Phone = "+44-20-0004", Address = "44 Motion Place", City = "Leeds", Country = "UK", IsActive = true },
    new Client { Id = Guid.NewGuid(), TenantId = creativeStudioId, Name = "Canvas Creative Co", Email = "ap@canvascreative.com", Phone = "+44-20-0005", Address = "55 Canvas Court", City = "Edinburgh", Country = "UK", IsActive = false }
};

db.Clients.AddRange(tcClients);
db.Clients.AddRange(csClients);

await db.SaveChangesAsync();

Console.WriteLine("Seeding invoices...");
var now = DateTime.UtcNow;
var rng = new Random(42);

async Task<Invoice> CreateInvoice(
    Guid tenantId, Guid clientId, string status, DateTime issueDate, DateTime dueDate,
    List<(string desc, decimal qty, decimal price)> lines,
    decimal taxRate, decimal discount, string shortCode, int seq)
{
    var lineItems = lines.Select(l => new InvoiceLineItem
    {
        Id = Guid.NewGuid(),
        Description = l.desc,
        Quantity = l.qty,
        UnitPrice = l.price,
        Amount = Math.Round(l.qty * l.price, 2)
    }).ToList();

    var subTotal = lineItems.Sum(x => x.Amount);
    var taxAmount = Math.Round(subTotal * (taxRate / 100), 2);
    var total = subTotal + taxAmount - discount;

    var inv = new Invoice
    {
        Id = Guid.NewGuid(),
        TenantId = tenantId,
        ClientId = clientId,
        InvoiceNumber = $"INV-{shortCode}-{issueDate.Year}-{seq:D4}",
        Status = status,
        IssueDate = issueDate,
        DueDate = dueDate,
        LineItems = lineItems,
        SubTotal = subTotal,
        TaxRate = taxRate,
        TaxAmount = taxAmount,
        DiscountAmount = discount,
        TotalAmount = total,
        Notes = "Thank you for your business!",
        PaidAt = status == InvoiceStatus.Paid ? issueDate.AddDays(5) : null,
        SentAt = status is InvoiceStatus.Sent or InvoiceStatus.Paid or InvoiceStatus.Overdue
            ? issueDate.AddHours(1) : null
    };
    return inv;
}

var tcShort = techCorpId.ToString().Replace("-", "").Substring(0, 4).ToUpper();
var csShort = creativeStudioId.ToString().Replace("-", "").Substring(0, 4).ToUpper();

// TechCorp 10 invoices (3 Paid, 2 Sent, 2 Draft, 2 Overdue, 1 Cancelled)
var tcInvoices = new List<Invoice>
{
    await CreateInvoice(techCorpId, tcClients[0].Id, InvoiceStatus.Paid, now.AddMonths(-3), now.AddMonths(-2).AddDays(30),
        new(){ ("Software Development - Phase 1", 40, 150), ("Code Review", 8, 120), ("Documentation", 5, 80) }, 10, 0, tcShort, 1),

    await CreateInvoice(techCorpId, tcClients[1].Id, InvoiceStatus.Paid, now.AddMonths(-2), now.AddMonths(-1).AddDays(30),
        new(){ ("API Integration Services", 30, 175), ("Testing & QA", 15, 100) }, 12, 200, tcShort, 2),

    await CreateInvoice(techCorpId, tcClients[2].Id, InvoiceStatus.Paid, now.AddMonths(-1), now.AddDays(30),
        new(){ ("Cloud Architecture Design", 20, 200), ("DevOps Setup", 10, 180), ("Training Session", 4, 150) }, 8, 0, tcShort, 3),

    await CreateInvoice(techCorpId, tcClients[3].Id, InvoiceStatus.Sent, now.AddDays(-10), now.AddDays(20),
        new(){ ("Mobile App Development", 50, 160), ("UI/UX Design", 20, 120) }, 15, 500, tcShort, 4),

    await CreateInvoice(techCorpId, tcClients[0].Id, InvoiceStatus.Sent, now.AddDays(-5), now.AddDays(25),
        new(){ ("Security Audit", 16, 200), ("Penetration Testing", 8, 250) }, 10, 0, tcShort, 5),

    await CreateInvoice(techCorpId, tcClients[1].Id, InvoiceStatus.Draft, now, now.AddDays(30),
        new(){ ("Data Analytics Dashboard", 25, 140), ("Report Generation Module", 10, 130) }, 12, 0, tcShort, 6),

    await CreateInvoice(techCorpId, tcClients[2].Id, InvoiceStatus.Draft, now.AddDays(-1), now.AddDays(29),
        new(){ ("Legacy System Migration", 60, 155), ("Data Cleanup", 20, 75) }, 10, 1000, tcShort, 7),

    await CreateInvoice(techCorpId, tcClients[3].Id, InvoiceStatus.Overdue, now.AddMonths(-2), now.AddMonths(-1),
        new(){ ("Website Redesign", 35, 130), ("SEO Optimization", 15, 90), ("Content Migration", 10, 70) }, 18, 0, tcShort, 8),

    await CreateInvoice(techCorpId, tcClients[4].Id, InvoiceStatus.Overdue, now.AddMonths(-3), now.AddMonths(-2),
        new(){ ("Database Optimization", 20, 160), ("Performance Tuning", 10, 180) }, 5, 0, tcShort, 9),

    await CreateInvoice(techCorpId, tcClients[0].Id, InvoiceStatus.Cancelled, now.AddMonths(-4), now.AddMonths(-3),
        new(){ ("Cancelled Project - R&D", 10, 200) }, 10, 0, tcShort, 10),
};

// Creative Studio 10 invoices
var csInvoices = new List<Invoice>
{
    await CreateInvoice(creativeStudioId, csClients[0].Id, InvoiceStatus.Paid, now.AddMonths(-3), now.AddMonths(-2).AddDays(30),
        new(){ ("Brand Identity Design", 30, 90), ("Logo Design", 5, 150), ("Brand Guidelines", 8, 80) }, 8, 0, csShort, 1),

    await CreateInvoice(creativeStudioId, csClients[1].Id, InvoiceStatus.Paid, now.AddMonths(-2), now.AddMonths(-1).AddDays(30),
        new(){ ("Campaign Design", 25, 95), ("Social Media Graphics", 40, 45) }, 10, 100, csShort, 2),

    await CreateInvoice(creativeStudioId, csClients[2].Id, InvoiceStatus.Paid, now.AddMonths(-1), now.AddDays(30),
        new(){ ("Website UI Design", 40, 85), ("Prototype Creation", 15, 70) }, 12, 0, csShort, 3),

    await CreateInvoice(creativeStudioId, csClients[3].Id, InvoiceStatus.Sent, now.AddDays(-7), now.AddDays(23),
        new(){ ("Video Production", 20, 200), ("Motion Graphics", 10, 150), ("Color Grading", 5, 120) }, 15, 0, csShort, 4),

    await CreateInvoice(creativeStudioId, csClients[0].Id, InvoiceStatus.Sent, now.AddDays(-3), now.AddDays(27),
        new(){ ("Print Design Materials", 15, 80), ("Illustration Pack", 5, 200) }, 8, 0, csShort, 5),

    await CreateInvoice(creativeStudioId, csClients[1].Id, InvoiceStatus.Draft, now, now.AddDays(30),
        new(){ ("Annual Report Design", 20, 120), ("Infographics", 8, 90) }, 10, 0, csShort, 6),

    await CreateInvoice(creativeStudioId, csClients[2].Id, InvoiceStatus.Draft, now.AddDays(-2), now.AddDays(28),
        new(){ ("Photography Session", 8, 250), ("Photo Editing", 20, 60) }, 5, 0, csShort, 7),

    await CreateInvoice(creativeStudioId, csClients[3].Id, InvoiceStatus.Overdue, now.AddMonths(-2), now.AddMonths(-1),
        new(){ ("App Icon Design", 10, 100), ("Splash Screen", 5, 80), ("Onboarding Screens", 15, 90) }, 12, 0, csShort, 8),

    await CreateInvoice(creativeStudioId, csClients[4].Id, InvoiceStatus.Overdue, now.AddMonths(-3), now.AddMonths(-2),
        new(){ ("Product Photography", 12, 180), ("Retouching", 24, 40) }, 8, 0, csShort, 9),

    await CreateInvoice(creativeStudioId, csClients[0].Id, InvoiceStatus.Cancelled, now.AddMonths(-4), now.AddMonths(-3),
        new(){ ("Cancelled Rebrand Project", 5, 150) }, 10, 0, csShort, 10),
};

db.Invoices.AddRange(tcInvoices);
db.Invoices.AddRange(csInvoices);
await db.SaveChangesAsync();

// Seed payments for paid invoices
Console.WriteLine("Seeding payments...");
var paidInvoices = tcInvoices.Concat(csInvoices).Where(i => i.Status == InvoiceStatus.Paid).ToList();
foreach (var inv in paidInvoices)
{
    db.Payments.Add(new Payment
    {
        Id = Guid.NewGuid(),
        TenantId = inv.TenantId,
        InvoiceId = inv.Id,
        Amount = inv.TotalAmount,
        Currency = "USD",
        StripePaymentIntentId = $"pi_mock_{Guid.NewGuid():N}".Substring(0, 30),
        Status = "Succeeded",
        PaidAt = inv.PaidAt,
        PaymentMethod = "card"
    });
}
await db.SaveChangesAsync();

Console.WriteLine("Database seeded successfully!");
Console.WriteLine();
Console.WriteLine("=== Login Credentials ===");
Console.WriteLine("superadmin@invoiceapp.com / SuperAdmin@1234  (SuperAdmin)");
Console.WriteLine("admin@techcorp.com / Admin@1234              (TenantAdmin - TechCorp)");
Console.WriteLine("user1@techcorp.com / User@1234               (User - TechCorp)");
Console.WriteLine("admin@creativestudio.com / Admin@1234        (TenantAdmin - Creative Studio)");
Console.WriteLine("user1@creativestudio.com / User@1234         (User - Creative Studio)");
