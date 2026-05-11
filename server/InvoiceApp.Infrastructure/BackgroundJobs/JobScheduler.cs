using Hangfire;

namespace InvoiceApp.Infrastructure.BackgroundJobs;

public static class JobScheduler
{
    public static void ScheduleRecurringJobs()
    {
        RecurringJob.AddOrUpdate<OverdueInvoiceJob>(
            "overdue-invoice-check",
            job => job.ExecuteAsync(),
            "0 9 * * *"); // Every day at 9:00 AM UTC
    }
}
