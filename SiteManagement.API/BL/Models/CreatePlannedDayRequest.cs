using System.ComponentModel.DataAnnotations;

namespace SiteManagement.API.BL.Models;

public record CreatePlannedDayRequest(
    [Required]
    DayOfWeek DayOfWeek,
    
    [Required]
    [Range(1, 8)] // Max 8 time slots
    int NumberOfTimeSlots
);
