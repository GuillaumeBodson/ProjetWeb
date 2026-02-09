using System.ComponentModel.DataAnnotations;

namespace SiteManagement.API.BL.Models;

public record CreatePlannedDayRequest(
    DayOfWeek DayOfWeek,
    int NumberOfTimeSlots,
    string StartTime
);
