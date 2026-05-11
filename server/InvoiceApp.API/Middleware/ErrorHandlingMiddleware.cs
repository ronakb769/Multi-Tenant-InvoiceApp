using System.Text.Json;
using InvoiceApp.Core.DTOs.Common;
using Microsoft.AspNetCore.Mvc;

namespace InvoiceApp.API.Middleware;

public class ErrorHandlingMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<ErrorHandlingMiddleware> _logger;
    private readonly IHostEnvironment _env;

    public ErrorHandlingMiddleware(RequestDelegate next, ILogger<ErrorHandlingMiddleware> logger, IHostEnvironment env)
    {
        _next = next;
        _logger = logger;
        _env = env;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unhandled exception: {Message}", ex.Message);
            await HandleExceptionAsync(context, ex);
        }
    }

    private async Task HandleExceptionAsync(HttpContext context, Exception exception)
    {
        context.Response.ContentType = "application/json";

        var (statusCode, message) = exception switch
        {
            KeyNotFoundException => (StatusCodes.Status404NotFound, exception.Message),
            UnauthorizedAccessException => (StatusCodes.Status403Forbidden, exception.Message),
            InvalidOperationException => (StatusCodes.Status400BadRequest, exception.Message),
            FluentValidation.ValidationException vex => (StatusCodes.Status400BadRequest, "Validation failed"),
            _ => (StatusCodes.Status500InternalServerError, _env.IsProduction()
                ? "An unexpected error occurred."
                : exception.Message)
        };

        context.Response.StatusCode = statusCode;

        List<string> errors = new();
        if (exception is FluentValidation.ValidationException ve)
            errors = ve.Errors.Select(e => e.ErrorMessage).ToList();

        var response = ApiResponse<object>.Fail(message, errors);
        await context.Response.WriteAsync(JsonSerializer.Serialize(response,
            new JsonSerializerOptions { PropertyNamingPolicy = JsonNamingPolicy.CamelCase }));
    }
}
