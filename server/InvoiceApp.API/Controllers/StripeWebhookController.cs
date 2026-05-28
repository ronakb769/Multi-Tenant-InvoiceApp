using InvoiceApp.Core.Interfaces.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace InvoiceApp.API.Controllers;

[ApiController]
[Route("api/v1/payments/stripe")]
[EnableRateLimiting("webhook")]
public class StripeWebhookController : ControllerBase
{
    private readonly IPaymentService _paymentService;
    private readonly ILogger<StripeWebhookController> _logger;

    public StripeWebhookController(IPaymentService paymentService, ILogger<StripeWebhookController> logger)
    {
        _paymentService = paymentService;
        _logger = logger;
    }

    [HttpPost("webhook")]
    public async Task<IActionResult> Webhook()
    {
        var payload = await new StreamReader(Request.Body).ReadToEndAsync();
        var signature = Request.Headers["Stripe-Signature"].FirstOrDefault();

        if (string.IsNullOrEmpty(signature))
            return BadRequest("Missing Stripe-Signature header.");

        try
        {
            await _paymentService.HandleStripeWebhookAsync(payload, signature);
            return Ok(new { received = true });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Stripe webhook error: {Message}", ex.Message);
            return BadRequest($"Webhook error: {ex.Message}");
        }
    }
}
