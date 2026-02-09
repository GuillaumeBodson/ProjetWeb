using SiteManagement.API.DAL.Entities;
using System.Globalization;

namespace SiteManagement.API.BL.Models;

public record TimeSlotResponse(
    Guid Id,
    int TimeSlotNumber,
    Guid CourtId,
    int WeekNumber,
    BookState BookState,
    DateTime DateTime
)
{
    public static DateTime CalculateDateTime(int weekNumber, int timeSlotNumber, TimeOnly startTime, DayOfWeek dayOfWeek)
    {
        var year = DateTime.UtcNow.Year;
        
        // Get the first day (Monday) of the specified ISO week
        var firstDayOfWeek = ISOWeek.ToDateTime(year, weekNumber, DayOfWeek.Monday);
        
        // Calculate the target day by adding offset from Monday
        var daysFromMonday = ((int)dayOfWeek - (int)DayOfWeek.Monday + 7) % 7;
        var targetDay = firstDayOfWeek.AddDays(daysFromMonday);

        var timeToAdd = (timeSlotNumber - 1) * 105;
        startTime.AddMinutes(timeToAdd);

        // Combine date with start time
        return targetDay.Add(startTime.ToTimeSpan());
    }
}
