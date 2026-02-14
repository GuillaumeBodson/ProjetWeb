using Microsoft.EntityFrameworkCore;
using SiteManagement.API.BL.Mappers;
using SiteManagement.API.BL.Models;
using SiteManagement.API.BL.Services.Abstractions;
using SiteManagement.API.DAL;
using SiteManagement.API.DAL.Entities;
using System.Globalization;
using ToolBox.EntityFramework.Filters;

namespace SiteManagement.API.BL.Services;

public class SiteService(
    SiteManagementDbContext context,
    ILogger<SiteService> logger) : ISiteService
{
    public async Task<SiteDetailsResponse?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var site = await context.Sites
            .Include(s => s.Courts)
            .Include(s => s.PlannedDays)
                .ThenInclude(pd => pd.TimeSlots)
            .FirstOrDefaultAsync(s => s.Id == id, cancellationToken);


        if (site is null)
        {
            return null;
        }

        return SiteMapper.ToResponseDetails(site);
    }

    public async Task<IEnumerable<SiteResponse>> GetAllAsync(CancellationToken cancellationToken = default)
    {
        var sites = await context.Sites.Select(s => new SiteResponse(
            s.Id,
            s.Name,
            s.Revenue,
            s.ClosedDays.ToList(),
            s.Courts.Count()
        ))
        .ToListAsync(cancellationToken);

        return sites;
    }

    public async Task<PageOf<SiteResponse>> GetPageAsync(PageRequest request, CancellationToken cancellationToken = default)
    {
        var page = await context.Sites.Select(s => new SiteResponse(
            s.Id,
            s.Name,
            s.Revenue,
            s.ClosedDays.ToList(),
            s.Courts.Count()
        ))
        .ToPageAsync(request, cancellationToken: cancellationToken);

        return page;
    }

    public async Task<SiteDetailsResponse> CreateAsync(CreateSiteRequest request, CancellationToken cancellationToken = default)
    {
        var site = new Site
        {
            Id = Guid.NewGuid(),
            Name = request.Name,
            ClosedDays = [.. request.ClosedDays?.Select(d => DateOnly.FromDateTime(d.ToUniversalTime())) ?? []]
        };

        context.Sites.Add(site);

        if (request.Courts is not null)
        {
            foreach (var courtRequest in request.Courts)
            {
                site.Courts.Add(new Court
                {
                    Id = Guid.NewGuid(),
                    Number = courtRequest.Number
                });
            }
        }

        // Create all 7 planned days using navigation property
        foreach (var scheduleRequest in request.Schedule.OrderBy(s => s.DayOfWeek))
        {
            site.PlannedDays.Add(new PlannedDay
            {
                Id = Guid.NewGuid(),
                DayOfWeek = scheduleRequest.DayOfWeek,
                NumberOfTimeSlots = scheduleRequest.NumberOfTimeSlots
            });
        }

        await context.SaveChangesAsync(cancellationToken);

        logger.LogInformation(
            "Created site {SiteId} with name {SiteName}, {CourtCount} courts, and 7 planned days (all days of week). Time slots will be created on-demand during booking.",
            site.Id, site.Name, site.Courts.Count);

        return SiteMapper.ToResponseDetails(site);
    }

    public async Task<SiteDetailsResponse?> UpdateAsync(Guid id, UpdateSiteRequest request, CancellationToken cancellationToken = default)
    {
        var site = await context.Sites
            .Include(s => s.Courts)
                .ThenInclude(c => c.TimeSlots)
            .Include(s => s.PlannedDays)
                .ThenInclude(pd => pd.TimeSlots)
            .FirstOrDefaultAsync(s => s.Id == id, cancellationToken);

        if (site is null)
        {
            return null;
        }

        site.Name = request.Name;
        site.ClosedDays = [.. request.ClosedDays?.Select(d => DateOnly.FromDateTime(d.ToUniversalTime())) ?? []];

        // Update courts using navigation property
        var existingCourtNumbers = site.Courts.Select(c => c.Number).ToHashSet();
        var newCourtNumbers = request.Courts?.Select(c => c.Number).ToHashSet() ?? [];

        // Find courts to remove
        var courtsToRemove = site.Courts
            .Where(c => !newCourtNumbers.Contains(c.Number))
            .ToList();

        // Remove courts (TimeSlots will be removed by EF Core due to tracked relationships)
        if (courtsToRemove.Count > 0)
        {
            var timeSlotCount = courtsToRemove.Sum(c => c.TimeSlots.Count);

            foreach (var court in courtsToRemove)
            {
                site.Courts.Remove(court);
            }

            logger.LogInformation(
                "Removed {CourtCount} courts and {TimeSlotCount} associated time slots for site {SiteId}",
                courtsToRemove.Count, timeSlotCount, site.Id);
        }

        // Add new courts using navigation property
        var courtsToAdd = newCourtNumbers.Except(existingCourtNumbers).ToList();
        foreach (var courtNumber in courtsToAdd)
        {
            site.Courts.Add(new Court
            {
                Id = Guid.NewGuid(),
                Number = courtNumber
            });
        }        

        await context.SaveChangesAsync(cancellationToken);

        logger.LogInformation(
            "Updated site {SiteId}: name and closed days updated, courts synchronized ({CourtCount} total), planned days preserved",
            site.Id, site.Courts.Count);

        return SiteMapper.ToResponseDetails(site);
    }

    public async Task<SiteDetailsResponse?> UpdateSiteScheduleAsync(Guid siteId, UpdateScheduleRequest request, CancellationToken cancellationToken)
    {
        var site = await context.Sites
            .Include(s => s.Courts)
            .Include(s => s.PlannedDays)
                .ThenInclude(pd => pd.TimeSlots)
            .FirstOrDefaultAsync(s => s.Id == siteId, cancellationToken);

        if (site is null)
        {
            return null;
        }
        // Update planned days using navigation property
        var plannedDaysByDayOfWeek = site.PlannedDays.ToDictionary(pd => pd.DayOfWeek);

        foreach (var plannedDayRequest in request.PlannedDays)
        {
            if (plannedDaysByDayOfWeek.TryGetValue(plannedDayRequest.DayOfWeek, out var existingPlannedDay))
            {
                // Update existing planned day
                existingPlannedDay.NumberOfTimeSlots = plannedDayRequest.NumberOfTimeSlots;
                if (TimeOnly.TryParseExact(plannedDayRequest.StartTime, "HH:mm", CultureInfo.InvariantCulture, DateTimeStyles.None, out var startTime))
                {
                    existingPlannedDay.StartTime = startTime;
                }
                else if(plannedDayRequest.StartTime is null)
                {
                    existingPlannedDay.StartTime = null;
                }

                logger.LogDebug(
                    "Updated PlannedDay for {DayOfWeek} on site {SiteId}: NumberOfTimeSplots = {NumberOfTimeSplots}",
                    plannedDayRequest.DayOfWeek, site.Id, plannedDayRequest.NumberOfTimeSlots);
            }
            else
            {
                // This should not happen if validation passed, but create missing planned day as failsafe
                site.PlannedDays.Add(new PlannedDay
                {
                    Id = Guid.NewGuid(),
                    DayOfWeek = plannedDayRequest.DayOfWeek,
                    StartTime = null,
                    NumberOfTimeSlots = plannedDayRequest.NumberOfTimeSlots
                });

                logger.LogWarning(
                    "Created missing PlannedDay for {DayOfWeek} on site {SiteId}",
                    plannedDayRequest.DayOfWeek, site.Id);
            }
        }
        await context.SaveChangesAsync(cancellationToken);

        return SiteMapper.ToResponseDetails(site);
    }

    public async Task<bool> DeleteAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var site = await context.Sites.FindAsync([id], cancellationToken);

        if (site is null)
        {
            logger.LogWarning("Site {SiteId} not found for deletion", id);
            return false;
        }

        context.Sites.Remove(site);
        await context.SaveChangesAsync(cancellationToken);

        logger.LogInformation("Deleted site {SiteId}", site.Id);

        return true;
    }

    public async Task<TimeSlotResponse?> BookTimeSlotAsync(Guid siteId, BookTimeSlotRequest request, CancellationToken cancellationToken = default)
    {
        // Validate that the site exists
        var site = await context.Sites.FindAsync([siteId], cancellationToken);
        if (site is null)
        {
            logger.LogWarning("Site {SiteId} not found", siteId);
            return null;
        }

        // Validate that the planned day exists and belongs to site
        var plannedDay = await context.PlannedDays.FindAsync([request.PlannedDayId], cancellationToken);
        if (plannedDay is null || plannedDay.SiteId != siteId)
        {
            logger.LogWarning("PlannedDay {PlannedDayId} not found or does not belong to site {SiteId}",
                request.PlannedDayId, siteId);
            return null;
        }

        if (plannedDay.StartTime is null)
        {
            logger.LogWarning("PlannedDay {PlannedDayId} has no StartTime defined", request.PlannedDayId);
            return null;
        }

        // Validate that the court exists and belongs to site
        var court = await context.Courts.FindAsync([request.CourtId], cancellationToken);
        if (court is null || court.SiteId != siteId)
        {
            logger.LogWarning("Court {CourtId} not found or does not belong to site {SiteId}",
                request.CourtId, siteId);
            return null;
        }

        // Validate time slot number is within range (business rule validation)
        if (request.TimeSlotNumber < 1 || request.TimeSlotNumber > plannedDay.NumberOfTimeSlots)
        {
            logger.LogWarning(
                "TimeSlotNumber {TimeSlotNumber} is out of range for PlannedDay {PlannedDayId} (max: {Max})",
                request.TimeSlotNumber, request.PlannedDayId, plannedDay.NumberOfTimeSlots);
            return null;
        }

        // Try to find existing time slot
        var timeSlot = await context.TimeSlots
            .FirstOrDefaultAsync(ts =>
                ts.PlannedDayId == request.PlannedDayId &&
                ts.CourtId == request.CourtId &&
                ts.TimeSlotNumber == request.TimeSlotNumber &&
                ts.WeekNumber == request.WeekNumber,
                cancellationToken);

        if (timeSlot is null)
        {
            // Create new time slot (business rule: only create when booking is made)
            timeSlot = new TimeSlot
            {
                Id = Guid.NewGuid(),
                PlannedDayId = request.PlannedDayId,
                CourtId = request.CourtId,
                TimeSlotNumber = request.TimeSlotNumber,
                WeekNumber = request.WeekNumber,
                BookState = request.BookState
            };

            context.TimeSlots.Add(timeSlot);

            logger.LogInformation(
                "Created new time slot {TimeSlotId} for PlannedDay {PlannedDayId}, Court {CourtId}, Slot {SlotNumber}, Week {WeekNumber} with state {BookState}",
                timeSlot.Id, request.PlannedDayId, request.CourtId, request.TimeSlotNumber, request.WeekNumber, request.BookState);
        }
        else
        {
            // Update existing time slot
            timeSlot.BookState = request.BookState;

            logger.LogInformation(
                "Updated time slot {TimeSlotId} to state {BookState}",
                timeSlot.Id, request.BookState);
        }

        await context.SaveChangesAsync(cancellationToken);

        return new TimeSlotResponse(
            timeSlot.Id,
            timeSlot.TimeSlotNumber,
            timeSlot.CourtId,
            timeSlot.WeekNumber,
            timeSlot.BookState,
            TimeSlotResponse.CalculateDateTime(timeSlot.WeekNumber, timeSlot.TimeSlotNumber, plannedDay.StartTime.Value, plannedDay.DayOfWeek));
    }
}
