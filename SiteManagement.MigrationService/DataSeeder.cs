using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using SiteManagement.API.DAL;
using SiteManagement.API.DAL.Entities;

namespace SiteManagement.MigrationService;

public class DataSeeder(
    SiteManagementDbContext context,
    ILogger<DataSeeder> logger)
{
    public async Task SeedAsync()
    {
        // Only seed if database is empty
        if (await context.Sites.AnyAsync())
        {
            logger.LogInformation("Database already contains data. Skipping seeding.");
            return;
        }

        logger.LogInformation("Seeding initial data...");

        // Define Site IDs
        var centralSportsId = Guid.Parse("11111111-1111-1111-1111-111111111111");
        var northCampusId = Guid.Parse("22222222-2222-2222-2222-222222222222");
        var riversideId = Guid.Parse("33333333-3333-3333-3333-333333333333");

        // Seed Sites
        var sites = new[]
        {
            new Site
            {
                Id = centralSportsId,
                Name = "Central Sports Complex",
                ClosedDays = [
                    new DateOnly(2026, 1, 1),  // New Year
                    new DateOnly(2026, 12, 25) // Christmas
                ]
            },
            new Site
            {
                Id = northCampusId,
                Name = "North Campus Tennis Center",
                ClosedDays = []
            },
            new Site
            {
                Id = riversideId,
                Name = "Riverside Athletic Club",
                ClosedDays = [
                    new DateOnly(2026, 7, 21) // National Holiday
                ]
            }
        };

        context.Sites.AddRange(sites);
        await context.SaveChangesAsync();
        logger.LogInformation("Seeded {Count} sites.", sites.Length);

        // Seed Courts
        var courts = new List<Court>();

        // Central Sports Complex - 5 courts
        for (int i = 1; i <= 5; i++)
        {
            courts.Add(new Court
            {
                Id = Guid.NewGuid(),
                Number = i,
                SiteId = centralSportsId
            });
        }

        // North Campus - 3 courts
        for (int i = 1; i <= 3; i++)
        {
            courts.Add(new Court
            {
                Id = Guid.NewGuid(),
                Number = i,
                SiteId = northCampusId
            });
        }

        // Riverside - 4 courts
        for (int i = 1; i <= 4; i++)
        {
            courts.Add(new Court
            {
                Id = Guid.NewGuid(),
                Number = i,
                SiteId = riversideId
            });
        }

        context.Courts.AddRange(courts);
        await context.SaveChangesAsync();
        logger.LogInformation("Seeded {Count} courts.", courts.Count);

        // Seed PlannedDays
        var plannedDays = new List<PlannedDay>();

        // Central Sports Complex - Open Monday to Saturday with 6 time slots per day
        foreach (var day in new[] { DayOfWeek.Monday, DayOfWeek.Tuesday, DayOfWeek.Wednesday, 
                                     DayOfWeek.Thursday, DayOfWeek.Friday, DayOfWeek.Saturday })
        {
            plannedDays.Add(new PlannedDay
            {
                Id = Guid.NewGuid(),
                SiteId = centralSportsId,
                DayOfWeek = day,
                NumberOfTimeSlots = 6
            });
        }

        // North Campus - Open all week with 8 time slots per day
        foreach (var day in Enum.GetValues<DayOfWeek>())
        {
            plannedDays.Add(new PlannedDay
            {
                Id = Guid.NewGuid(),
                SiteId = northCampusId,
                DayOfWeek = day,
                NumberOfTimeSlots = 8
            });
        }

        // Riverside - Open Tuesday to Sunday with 5 time slots per day
        foreach (var day in new[] { DayOfWeek.Tuesday, DayOfWeek.Wednesday, DayOfWeek.Thursday,
                                     DayOfWeek.Friday, DayOfWeek.Saturday, DayOfWeek.Sunday })
        {
            plannedDays.Add(new PlannedDay
            {
                Id = Guid.NewGuid(),
                SiteId = riversideId,
                DayOfWeek = day,
                NumberOfTimeSlots = 5
            });
        }

        context.PlannedDays.AddRange(plannedDays);
        await context.SaveChangesAsync();
        logger.LogInformation("Seeded {Count} planned days.", plannedDays.Count);

        // Optionally seed TimeSlots (example: seed for current week)
        var timeSlots = new List<TimeSlot>();
        var currentWeekNumber = GetIso8601WeekOfYear(DateTime.UtcNow);

        foreach (var plannedDay in plannedDays)
        {
            var courtsForSite = courts.Where(c => c.SiteId == plannedDay.SiteId).ToList();

            foreach (var court in courtsForSite)
            {
                for (int slotNumber = 1; slotNumber <= plannedDay.NumberOfTimeSlots; slotNumber++)
                {
                    timeSlots.Add(new TimeSlot
                    {
                        Id = Guid.NewGuid(),
                        PlannedDayId = plannedDay.Id,
                        CourtId = court.Id,
                        TimeSlotNumber = slotNumber,
                        WeekNumber = currentWeekNumber,
                        BookState = BookState.BookInProgress
                    });
                }
            }
        }

        context.TimeSlots.AddRange(timeSlots);
        await context.SaveChangesAsync();
        logger.LogInformation("Seeded {Count} time slots for week {Week}.", timeSlots.Count, currentWeekNumber);

        logger.LogInformation("Data seeding completed successfully!");
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