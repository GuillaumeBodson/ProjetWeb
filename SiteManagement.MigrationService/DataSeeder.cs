using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using SiteManagement.API.DAL;
using SiteManagement.API.DAL.Entities;

namespace SiteManagement.MigrationService;

public class DataSeeder(
    SiteManagementDbContext context,
    ILogger<DataSeeder> logger,
    IOptions<SeedingOptions> seedingOptions)
{
    public async Task SeedAsync(CancellationToken cancellationToken = default)
    {
        var forceRecreate = seedingOptions.Value.ForceRecreate;

        if (forceRecreate)
        {
            logger.LogWarning("ForceRecreate is enabled - dropping and recreating database...");
            await context.Database.EnsureDeletedAsync(cancellationToken);
            await context.Database.MigrateAsync(cancellationToken);
        }

        if (await context.Sites.AnyAsync(cancellationToken))
        {
            logger.LogInformation("Database already contains data. Skipping seeding.");
            return;
        }

        logger.LogInformation("Seeding initial data with transaction...");

        // Use execution strategy for resilient transaction support
        var strategy = context.Database.CreateExecutionStrategy();

        await strategy.ExecuteAsync(async () =>
        {
            // Set command timeout to 5 minutes for seeding operations
            context.Database.SetCommandTimeout(TimeSpan.FromMinutes(5));

            await using var transaction = await context.Database.BeginTransactionAsync(cancellationToken);

            try
            {
                var sites = await SeedSitesAsync(cancellationToken);
                var courts = await SeedCourtsAsync(sites, cancellationToken);
                var plannedDays = await SeedPlannedDaysAsync(sites, cancellationToken);
                await SeedTimeSlotsAsync(courts, plannedDays, cancellationToken);

                await transaction.CommitAsync(cancellationToken);
                logger.LogInformation("Transaction committed. Data seeding completed successfully!");
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Error during seeding, rolling back transaction...");
                await transaction.RollbackAsync(CancellationToken.None); // Use None to ensure rollback completes
                throw;
            }
        });
    }

    private async Task<Site[]> SeedSitesAsync(CancellationToken cancellationToken)
    {
        var currentYear = DateTime.UtcNow.Year;

        var sites = new[]
        {
            new Site
            {
                Id = Guid.Parse("11111111-1111-1111-1111-111111111111"),
                Name = "Central Sports Complex",
                ClosedDays = [
                    new DateOnly(currentYear, 1, 1),
                    new DateOnly(currentYear, 12, 25)
                ]
            },
            new Site
            {
                Id = Guid.Parse("22222222-2222-2222-2222-222222222222"),
                Name = "North Campus Tennis Center",
                ClosedDays = []
            },
            new Site
            {
                Id = Guid.Parse("33333333-3333-3333-3333-333333333333"),
                Name = "Riverside Athletic Club",
                ClosedDays = [new DateOnly(currentYear, 7, 21)]
            }
        };

        context.Sites.AddRange(sites);
        await context.SaveChangesAsync(cancellationToken);
        logger.LogInformation("Seeded {Count} sites.", sites.Length);

        return sites;
    }

    private async Task<List<Court>> SeedCourtsAsync(Site[] sites, CancellationToken cancellationToken)
    {
        var courtConfigurations = new Dictionary<Guid, int>
        {
            [sites[0].Id] = 5,  // Central Sports Complex
            [sites[1].Id] = 3,  // North Campus
            [sites[2].Id] = 4   // Riverside
        };

        var courts = courtConfigurations
            .SelectMany(config => Enumerable.Range(1, config.Value)
                .Select(number => new Court
                {
                    Id = Guid.NewGuid(),
                    Number = number,
                    SiteId = config.Key
                }))
            .ToList();

        context.Courts.AddRange(courts);
        await context.SaveChangesAsync(cancellationToken);
        logger.LogInformation("Seeded {Count} courts.", courts.Count);

        return courts;
    }

    private async Task<List<PlannedDay>> SeedPlannedDaysAsync(Site[] sites, CancellationToken cancellationToken)
    {
        var plannedDays = new List<PlannedDay>();

        // Central Sports Complex - Monday to Saturday, 6 slots
        plannedDays.AddRange(CreatePlannedDaysForSite(
            sites[0].Id,
            [DayOfWeek.Monday, DayOfWeek.Tuesday, DayOfWeek.Wednesday,
             DayOfWeek.Thursday, DayOfWeek.Friday, DayOfWeek.Saturday],
            6));

        // North Campus - All week, 8 slots
        plannedDays.AddRange(CreatePlannedDaysForSite(
            sites[1].Id,
            Enum.GetValues<DayOfWeek>(),
            8));

        // Riverside - Tuesday to Sunday, 5 slots
        plannedDays.AddRange(CreatePlannedDaysForSite(
            sites[2].Id,
            [DayOfWeek.Tuesday, DayOfWeek.Wednesday, DayOfWeek.Thursday,
             DayOfWeek.Friday, DayOfWeek.Saturday, DayOfWeek.Sunday],
            5));

        context.PlannedDays.AddRange(plannedDays);
        await context.SaveChangesAsync(cancellationToken);
        logger.LogInformation("Seeded {Count} planned days.", plannedDays.Count);

        return plannedDays;
    }

    private static IEnumerable<PlannedDay> CreatePlannedDaysForSite(
        Guid siteId,
        IEnumerable<DayOfWeek> days,
        int numberOfTimeSlots)
    {
        return days.Select(day => new PlannedDay
        {
            Id = Guid.NewGuid(),
            SiteId = siteId,
            DayOfWeek = day,
            NumberOfTimeSlots = numberOfTimeSlots
        });
    }

    private async Task SeedTimeSlotsAsync(
        List<Court> courts,
        List<PlannedDay> plannedDays,
        CancellationToken cancellationToken)
    {
        var currentWeekNumber = GetIso8601WeekOfYear(DateTime.UtcNow);

        var timeSlots = plannedDays
            .SelectMany(plannedDay => courts
                .Where(c => c.SiteId == plannedDay.SiteId)
                .SelectMany(court => Enumerable.Range(1, plannedDay.NumberOfTimeSlots)
                    .Select(slotNumber => new TimeSlot
                    {
                        Id = Guid.NewGuid(),
                        PlannedDayId = plannedDay.Id,
                        CourtId = court.Id,
                        TimeSlotNumber = slotNumber,
                        WeekNumber = currentWeekNumber,
                        BookState = BookState.BookInProgress
                    })))
            .ToList();

        context.TimeSlots.AddRange(timeSlots);
        await context.SaveChangesAsync(cancellationToken);
        logger.LogInformation("Seeded {Count} time slots for week {Week}.", timeSlots.Count, currentWeekNumber);
    }

    private static int GetIso8601WeekOfYear(DateTime date)
    {
        var day = System.Globalization.CultureInfo.InvariantCulture.Calendar.GetDayOfWeek(date);
        if (day >= DayOfWeek.Monday && day <= DayOfWeek.Wednesday)
        {
            date = date.AddDays(3);
        }

        return System.Globalization.CultureInfo.InvariantCulture.Calendar.GetWeekOfYear(
            date,
            System.Globalization.CalendarWeekRule.FirstFourDayWeek,
            DayOfWeek.Monday);
    }
}