using Azure.Storage.Blobs;
using Azure.Storage.Blobs.Models;
using Azure.Storage.Sas;
using InvoiceApp.Core.Entities;
using InvoiceApp.Core.Interfaces.Services;
using iText.Html2pdf;
using iText.Kernel.Pdf;
using Microsoft.Extensions.Configuration;

namespace InvoiceApp.Infrastructure.Services;

public class PdfService : IPdfService
{
    private readonly IConfiguration _config;

    public PdfService(IConfiguration config)
    {
        _config = config;
    }

    public Task<byte[]> GenerateInvoicePdfAsync(Invoice invoice)
    {
        try
        {
            var html = BuildInvoiceHtml(invoice);
            var ms = new MemoryStream();

            using (var writer = new PdfWriter(ms))
            using (var pdf = new PdfDocument(writer))
            {
                HtmlConverter.ConvertToPdf(html, pdf, new ConverterProperties());
            }

            return Task.FromResult(ms.ToArray());
        }
        catch(Exception ex)
        {
            throw ex;
        }
    }

    public async Task<string> UploadPdfAsync(Invoice invoice)
    {
        var pdfBytes = await GenerateInvoicePdfAsync(invoice);

        var connStr = _config["AzureBlobStorage:ConnectionString"]!;
        var container = _config["AzureBlobStorage:ContainerName"] ?? "invoices";

        var serviceClient = new BlobServiceClient(connStr);
        var blobContainer = serviceClient.GetBlobContainerClient(container);

        // Private container — no public access needed
        await blobContainer.CreateIfNotExistsAsync(PublicAccessType.None);

        var blobName = $"{invoice.TenantId}/{invoice.InvoiceNumber}.pdf";
        var blob = blobContainer.GetBlobClient(blobName);

        using var stream = new MemoryStream(pdfBytes);
        await blob.UploadAsync(stream, overwrite: true);
        await blob.SetHttpHeadersAsync(new BlobHttpHeaders { ContentType = "application/pdf" });

        // Generate SAS URL valid for 1 year (adjust for production)
        var sasUri = blob.GenerateSasUri(BlobSasPermissions.Read, DateTimeOffset.UtcNow.AddYears(1));
        return sasUri.ToString();
    }

    private static string BuildInvoiceHtml(Invoice invoice)
    {
        var brand = invoice.Tenant?.PrimaryColor ?? "#1d3557";
        var logoUrl = invoice.Tenant?.LogoUrl;

        var statusColor = invoice.Status?.ToString() switch
        {
            "Sent"      => "#0d6efd",
            "Paid"      => "#198754",
            "Overdue"   => "#dc3545",
            "Cancelled" => "#adb5bd",
            _           => "#6c757d"
        };

        var logoHtml = !string.IsNullOrWhiteSpace(logoUrl)
            ? $"<img src='{System.Net.WebUtility.HtmlEncode(logoUrl)}' alt='logo' style='max-height:56px;max-width:180px;object-fit:contain;margin-bottom:4px' />"
            : "";

        var lineItemsHtml = string.Join("", invoice.LineItems.Select(li =>
            $@"<tr>
                <td style='padding:10px 12px;border-bottom:1px solid #dee2e6'>{System.Net.WebUtility.HtmlEncode(li.Description)}</td>
                <td style='padding:10px 12px;border-bottom:1px solid #dee2e6;text-align:center'>{li.Quantity}</td>
                <td style='padding:10px 12px;border-bottom:1px solid #dee2e6;text-align:right'>${li.UnitPrice:F2}</td>
                <td style='padding:10px 12px;border-bottom:1px solid #dee2e6;text-align:right'>${li.Amount:F2}</td>
               </tr>"));

        var notesHtml = string.IsNullOrEmpty(invoice.Notes) ? "" :
            $@"<div style='margin-top:28px'>
                 <div style='color:#6c757d;font-size:11px;text-transform:uppercase;letter-spacing:0.05em;font-weight:600;margin-bottom:4px'>Notes</div>
                 <div style='font-weight:500'>{System.Net.WebUtility.HtmlEncode(invoice.Notes)}</div>
               </div>";

        return $@"<!DOCTYPE html>
<html>
<head>
<meta charset='utf-8'>
<style>
  body {{ font-family: Arial, sans-serif; font-size: 14px; color: #212529; margin: 40px; }}
  table {{ width: 100%; border-collapse: collapse; }}
  th {{ background: {brand}; color: white; padding: 10px 12px; text-align: left; font-size: 13px; }}
</style>
</head>
<body>

<div style='display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:28px'>
  <div>
    {logoHtml}
    <div style='font-size:20px;font-weight:bold;color:{brand}'>{System.Net.WebUtility.HtmlEncode(invoice.Tenant?.Name ?? "Company")}</div>
  </div>
  <div style='text-align:right'>
    <div style='font-size:26px;font-weight:bold;color:{brand}'>{System.Net.WebUtility.HtmlEncode(invoice.InvoiceNumber)}</div>
    <span style='display:inline-block;padding:3px 12px;border-radius:6px;font-size:12px;font-weight:bold;background:{statusColor};color:white'>{invoice.Status}</span>
  </div>
</div>

<div style='display:flex;gap:48px;margin-bottom:20px'>
  <div style='flex:1'>
    <div style='color:#6c757d;font-size:11px;text-transform:uppercase;letter-spacing:0.05em;font-weight:600;margin-bottom:4px'>Bill To</div>
    <div><strong>{System.Net.WebUtility.HtmlEncode(invoice.Client?.Name ?? "")}</strong></div>
    <div style='color:#0d6efd'>{System.Net.WebUtility.HtmlEncode(invoice.Client?.Email ?? "")}</div>
    <div>{System.Net.WebUtility.HtmlEncode(invoice.Client?.Address ?? "")}</div>
    <div>{System.Net.WebUtility.HtmlEncode(invoice.Client?.City ?? "")} {System.Net.WebUtility.HtmlEncode(invoice.Client?.Country ?? "")}</div>
  </div>
  <div style='flex:1'>
    <div style='color:#6c757d;font-size:11px;text-transform:uppercase;letter-spacing:0.05em;font-weight:600;margin-bottom:4px'>Issue Date</div>
    <div><strong>{invoice.IssueDate:MMM dd, yyyy}</strong></div>
    <div style='color:#6c757d;font-size:11px;text-transform:uppercase;letter-spacing:0.05em;font-weight:600;margin-bottom:4px;margin-top:12px'>Due Date</div>
    <div><strong>{invoice.DueDate:MMM dd, yyyy}</strong></div>
  </div>
</div>

<table style='margin-top:16px'>
  <thead>
    <tr>
      <th>Description</th>
      <th style='text-align:center'>Qty</th>
      <th style='text-align:right'>Unit Price</th>
      <th style='text-align:right'>Amount</th>
    </tr>
  </thead>
  <tbody>
    {lineItemsHtml}
    <tr>
      <td style='padding:8px 12px;border-bottom:1px solid #dee2e6;text-align:right;color:#6c757d' colspan='3'>Subtotal</td>
      <td style='padding:8px 12px;border-bottom:1px solid #dee2e6;text-align:right'>${invoice.SubTotal:F2}</td>
    </tr>
    <tr>
      <td style='padding:8px 12px;border-bottom:1px solid #dee2e6;text-align:right;color:#6c757d' colspan='3'>Tax ({invoice.TaxRate:G}%)</td>
      <td style='padding:8px 12px;border-bottom:1px solid #dee2e6;text-align:right'>${invoice.TaxAmount:F2}</td>
    </tr>
    <tr>
      <td style='padding:8px 12px;border-bottom:1px solid #dee2e6;text-align:right;color:#dc3545' colspan='3'>Discount</td>
      <td style='padding:8px 12px;border-bottom:1px solid #dee2e6;text-align:right;color:#dc3545'>-${invoice.DiscountAmount:F2}</td>
    </tr>
    <tr style='background:#f8f9fa'>
      <td style='padding:10px 12px;border-top:2px solid {brand};text-align:right;font-weight:bold;font-size:15px' colspan='3'>Total</td>
      <td style='padding:10px 12px;border-top:2px solid {brand};text-align:right;font-weight:bold;font-size:15px;color:{brand}'>${invoice.TotalAmount:F2}</td>
    </tr>
  </tbody>
</table>

{notesHtml}

<div style='margin-top:48px;color:#6c757d;font-size:11px;border-top:1px solid #dee2e6;padding-top:10px'>
  Generated by InvoicePro &bull; {DateTime.UtcNow:yyyy-MM-dd HH:mm} UTC
</div>
</body>
</html>";
    }
}
