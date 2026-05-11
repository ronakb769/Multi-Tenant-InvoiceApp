using System.IdentityModel.Tokens.Jwt;
using InvoiceApp.Core.Interfaces;

namespace InvoiceApp.API.Middleware;

public class TenantMiddleware
{
    private readonly RequestDelegate _next;

    public TenantMiddleware(RequestDelegate next)
    {
        _next = next;
    }

    public async Task InvokeAsync(HttpContext context, ITenantContext tenantContext)
    {
        var authHeader = context.Request.Headers.Authorization.FirstOrDefault();
        if (authHeader?.StartsWith("Bearer ") == true)
        {
            var token = authHeader.Substring(7);
            try
            {
                var handler = new JwtSecurityTokenHandler();
                if (handler.CanReadToken(token))
                {
                    var jwt = handler.ReadJwtToken(token);

                    var sub = jwt.Claims.FirstOrDefault(c => c.Type == JwtRegisteredClaimNames.Sub)?.Value
                           ?? jwt.Claims.FirstOrDefault(c => c.Type == "sub")?.Value;
                    var role = jwt.Claims.FirstOrDefault(c => c.Type == "http://schemas.microsoft.com/ws/2008/06/identity/claims/role")?.Value
                            ?? jwt.Claims.FirstOrDefault(c => c.Type == "role")?.Value;
                    var tenantId = jwt.Claims.FirstOrDefault(c => c.Type == "tenantId")?.Value;

                    if (Guid.TryParse(sub, out var userId))
                        tenantContext.UserId = userId;

                    if (!string.IsNullOrEmpty(role))
                        tenantContext.UserRole = role;

                    if (Guid.TryParse(tenantId, out var tid))
                        tenantContext.TenantId = tid;
                }
            }
            catch
            {
                // Ignore invalid tokens — auth middleware will handle rejection
            }
        }

        await _next(context);
    }
}
