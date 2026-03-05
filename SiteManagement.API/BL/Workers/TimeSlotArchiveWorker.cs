using Microsoft.EntityFrameworkCore;
using SiteManagement.API.BL.Helpers;
using SiteManagement.API.BL.Models;
using SiteManagement.API.DAL;
using SiteManagement.API.DAL.Entities;
using System.Globalization;

namespace SiteManagement.API.BL.Workers;

public class TimeSlotArchiveWorker(
    IServiceScopeFactory scopeFactory,
    ILogger<TimeSlotArchiveWorker> logger) : BackgroundService
{
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        logger.LogInformation("TimeSlotArchiveWorker started");

        while (!stoppingToken.IsCancellationRequested)
        {
            var delay = GetDelayUntilNextRun();
            logger.LogDebug("Next archive run in {Delay}", delay);

            await Task.Delay(delay, stoppingToken);
            await ArchivePastTimeSlotsAsync(stoppingToken);
        }
    }

    private TimeSpan GetDelayUntilNextRun()
    {
        var now = DateTime.UtcNow;
        var nextRun = now.Date.AddHours(2);

        // If the scheduled time has already passed today, target tomorrow
        if (nextRun <= now)
            nextRun = nextRun.AddDays(1);

        return nextRun - now;
    }

    private async Task ArchivePastTimeSlotsAsync(CancellationToken cancellationToken)
    {
        using var scope = scopeFactory.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<SiteManagementDbContext>();

        var now = DateTime.UtcNow;
        var currentWeek = ISOWeek.GetWeekOfYear(now);
        var currentYear = now.Year;
        var currentDayOfWeekIso = now.DayOfWeek == DayOfWeek.Sunday ? 7 : (int)now.DayOfWeek;

        var pastDaysOfWeek = Enum.GetValues<DayOfWeek>()
            .Where(d => (d == DayOfWeek.Sunday ? 7 : (int)d) < currentDayOfWeekIso)
            .ToArray();

        var pastTimeSlots = await context.TimeSlots
            .Include(ts => ts.PlannedDay)
            .Where(ts => ts.Year < currentYear
                      || (ts.Year == currentYear && ts.WeekNumber < currentWeek)
                      || (ts.Year == currentYear
                          && ts.WeekNumber == currentWeek
                          && pastDaysOfWeek.Contains(ts.PlannedDay.DayOfWeek))).ToListAsync(cancellationToken);

        if (pastTimeSlots.Count == 0)
        {
            logger.LogDebug("No past time slots to archive");
            return;
        }

        var history = pastTimeSlots.Select(ts => new TimeSlotHistory
        {
            Id = ts.Id,
            PlannedDayId = ts.PlannedDayId,
            CourtId = ts.CourtId,
            TimeSlotNumber = ts.TimeSlotNumber,
            FinalBookState = ts.BookState,
            WeekNumber = ts.WeekNumber,
            Year = ts.Year,
            StartDateTime = TimeCalculationHelper.CalculateDateTime(ts),
            ArchivedAt = now
        }).ToList();

        await using var transaction = await context.Database.BeginTransactionAsync(cancellationToken);
        try
        {
            context.TimeSlotHistories.AddRange(history);
            context.TimeSlots.RemoveRange(pastTimeSlots);
            await context.SaveChangesAsync(cancellationToken);
            await transaction.CommitAsync(cancellationToken);

            logger.LogInformation("Archived {Count} past time slots (week < {Week}/{Year})",
                pastTimeSlots.Count, currentWeek, currentYear);
        }
        catch (OperationCanceledException) when (cancellationToken.IsCancellationRequested)
        {
            throw;
        }
        catch (Exception ex) when (!cancellationToken.IsCancellationRequested)
        {
            await transaction.RollbackAsync(cancellationToken);
            logger.LogError(ex, "Failed to archive past time slots — transaction rolled back");
        }
    }
}