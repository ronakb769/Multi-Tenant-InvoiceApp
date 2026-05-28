using System.Text;
using System.Threading.RateLimiting;
using FluentValidation;
using FluentValidation.AspNetCore;
using Hangfire;
using Hangfire.SqlServer;
using InvoiceApp.API.Filters;
using InvoiceApp.API.Middleware;
using InvoiceApp.Core.Constants;
using InvoiceApp.Core.DTOs.Common;
using InvoiceApp.Infrastructure;
using InvoiceApp.Infrastructure.BackgroundJobs;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.IdentityModel.Tokens;
using Serilog;

var builder = WebApplication.CreateBuilder(args);

// Serilog
Log.Logger = new LoggerConfiguration()
    .ReadFrom.Configuration(builder.Configuration)
    .Enrich.FromLogContext()
    .WriteTo.Console()
    .WriteTo.File("logs/invoiceapp-.log", rollingInterval: RollingInterval.Day)
    .CreateLogger();
builder.Host.UseSerilog();

// Infrastructure (EF, services, repos)
builder.Services.AddInfrastructure(builder.Configuration);

// FluentValidation
builder.Services.AddFluentValidationAutoValidation();
builder.Services.AddValidatorsFromAssemblyContaining<InvoiceApp.Core.Validators.LoginDtoValidator>();

// Controllers + filters
builder.Services.AddHttpContextAccessor();
builder.Services.AddControllers(options =>
    options.Filters.Add<ValidationFilter>());

// JWT Auth
var jwtSecret = builder.Configuration["JwtSettings:Secret"]!;
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = builder.Configuration["JwtSettings:Issuer"],
            ValidAudience = builder.Configuration["JwtSettings:Audience"],
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSecret)),
            ClockSkew = TimeSpan.Zero
        };
    });

builder.Services.AddAuthorization(options =>
{
    options.AddPolicy("SuperAdmin", policy => policy.RequireRole(Roles.SuperAdmin));
    options.AddPolicy("TenantAdmin", policy => policy.RequireRole(Roles.TenantAdmin));
});

// CORS
builder.Services.AddCors(options =>
    options.AddPolicy("ClientPolicy", policy => policy
        .WithOrigins(builder.Configuration["ClientUrl"] ?? "http://localhost:5173")
        .AllowAnyHeader()
        .AllowAnyMethod()
        .AllowCredentials()));

// Rate limiting
var authLimit   = builder.Configuration.GetValue<int>("RateLimit:AuthEndpoints:Limit", 10);
var authWindow  = builder.Configuration.GetValue<int>("RateLimit:AuthEndpoints:WindowMinutes", 15);
var apiLimit    = builder.Configuration.GetValue<int>("RateLimit:ApiEndpoints:Limit", 100);
var apiWindow   = builder.Configuration.GetValue<int>("RateLimit:ApiEndpoints:WindowMinutes", 15);
var hookLimit   = builder.Configuration.GetValue<int>("RateLimit:WebhookEndpoint:Limit", 60);
var hookWindow  = builder.Configuration.GetValue<int>("RateLimit:WebhookEndpoint:WindowMinutes", 1);

builder.Services.AddRateLimiter(options =>
{
    // Return 429 with standard ApiResponse JSON + Retry-After header
    options.OnRejected = async (context, cancellationToken) =>
    {
        context.HttpContext.Response.StatusCode = StatusCodes.Status429TooManyRequests;
        context.HttpContext.Response.ContentType = "application/json";

        if (context.Lease.TryGetMetadata(MetadataName.RetryAfter, out var retryAfter))
            context.HttpContext.Response.Headers.RetryAfter =
                ((int)retryAfter.TotalSeconds).ToString();

        await context.HttpContext.Response.WriteAsJsonAsync(
            ApiResponse<object>.Fail("Too many requests. Please wait and try again."),
            cancellationToken);
    };

    // "auth" — login / register / forgot-password / reset-password
    // Partition: IP address (user is not authenticated yet)
    options.AddFixedWindowLimiter("auth", opt =>
    {
        opt.PermitLimit         = authLimit;
        opt.Window              = TimeSpan.FromMinutes(authWindow);
        opt.QueueProcessingOrder = QueueProcessingOrder.OldestFirst;
        opt.QueueLimit          = 0;
    });

    // "api" — all authenticated application endpoints
    // Partition: user ID when authenticated, IP address otherwise
    options.AddPolicy("api", httpContext =>
    {
        var userId = httpContext.User?.FindFirst(
            System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        var key = !string.IsNullOrEmpty(userId)
            ? $"user:{userId}"
            : $"ip:{httpContext.Connection.RemoteIpAddress}";

        return RateLimitPartition.GetFixedWindowLimiter(key, _ =>
            new FixedWindowRateLimiterOptions
            {
                PermitLimit          = apiLimit,
                Window               = TimeSpan.FromMinutes(apiWindow),
                QueueProcessingOrder = QueueProcessingOrder.OldestFirst,
                QueueLimit           = 0
            });
    });

    // "webhook" — Stripe webhook endpoint (server-to-server, higher burst allowance)
    // Partition: IP address
    options.AddFixedWindowLimiter("webhook", opt =>
    {
        opt.PermitLimit         = hookLimit;
        opt.Window              = TimeSpan.FromMinutes(hookWindow);
        opt.QueueProcessingOrder = QueueProcessingOrder.OldestFirst;
        opt.QueueLimit          = 0;
    });
});

// Hangfire
var connStr = builder.Configuration.GetConnectionString("DefaultConnection")!;
builder.Services.AddHangfire(config => config
    .SetDataCompatibilityLevel(CompatibilityLevel.Version_180)
    .UseSimpleAssemblyNameTypeSerializer()
    .UseRecommendedSerializerSettings()
    .UseSqlServerStorage(connStr, new SqlServerStorageOptions
    {
        CommandBatchMaxTimeout = TimeSpan.FromMinutes(5),
        SlidingInvisibilityTimeout = TimeSpan.FromMinutes(5),
        QueuePollInterval = TimeSpan.Zero,
        UseRecommendedIsolationLevel = true,
        DisableGlobalLocks = true
    }));
builder.Services.AddHangfireServer();

// Swagger
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new() { Title = "InvoiceApp API", Version = "v1" });
    c.AddSecurityDefinition("Bearer", new Microsoft.OpenApi.Models.OpenApiSecurityScheme
    {
        Name = "Authorization",
        Type = Microsoft.OpenApi.Models.SecuritySchemeType.Http,
        Scheme = "bearer",
        BearerFormat = "JWT",
        In = Microsoft.OpenApi.Models.ParameterLocation.Header
    });
    c.AddSecurityRequirement(new Microsoft.OpenApi.Models.OpenApiSecurityRequirement
    {
        {
            new Microsoft.OpenApi.Models.OpenApiSecurityScheme
            {
                Reference = new Microsoft.OpenApi.Models.OpenApiReference
                {
                    Type = Microsoft.OpenApi.Models.ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            Array.Empty<string>()
        }
    });
});

var app = builder.Build();

// Middleware pipeline
app.UseMiddleware<ErrorHandlingMiddleware>();
app.UseMiddleware<RequestLoggingMiddleware>();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors("ClientPolicy");
app.UseRateLimiter();         // after CORS so preflight OPTIONS don't consume tokens
app.UseAuthentication();
app.UseMiddleware<TenantMiddleware>();
app.UseAuthorization();

// Hangfire dashboard (SuperAdmin only)
var httpContextAccessor = app.Services.GetRequiredService<IHttpContextAccessor>();
app.UseHangfireDashboard("/hangfire", new DashboardOptions
{
    Authorization = new[] { new HangfireAuthFilter(httpContextAccessor) }
});

app.MapControllers();

// Schedule background jobs
JobScheduler.ScheduleRecurringJobs();

app.Run();

// Hangfire auth filter
public class HangfireAuthFilter : Hangfire.Dashboard.IDashboardAuthorizationFilter
{
    private readonly IHttpContextAccessor _httpContextAccessor;

    public HangfireAuthFilter(IHttpContextAccessor httpContextAccessor)
    {
        _httpContextAccessor = httpContextAccessor;
    }

    public bool Authorize(Hangfire.Dashboard.DashboardContext context)
    {
        return _httpContextAccessor.HttpContext?.User.IsInRole(Roles.SuperAdmin) ?? false;
    }
}
