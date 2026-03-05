using SiteManagement.API.DAL.Entities;
using System.Globalization;

namespace SiteManagement.API.BL.Helpers;

public static class TimeCalculationHelper
{
    public static DateTime CalculateDateTime(TimeSlot timeSlot)
    {
        if (timeSlot.PlannedDay?.StartTime is null)
        {
            return default;
        }
        // Get the first day (Monday) of the specified ISO week
        var firstDayOfWeek = ISOWeek.ToDateTime(timeSlot.Year, timeSlot.WeekNumber, DayOfWeek.Monday);

        // Calculate the target day by adding offset from Monday
        var daysFromMonday = ((int)timeSlot.PlannedDay.DayOfWeek - (int)DayOfWeek.Monday + 7) % 7;
        var targetDay = firstDayOfWeek.AddDays(daysFromMonday);

        var timeToAdd = (timeSlot.TimeSlotNumber - 1) * 105;
        var startTime = timeSlot.PlannedDay.StartTime.Value.AddMinutes(timeToAdd);

        // Combine date with start time
        return targetDay.Add(startTime.ToTimeSpan());
    }
}
