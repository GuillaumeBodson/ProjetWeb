using System.ComponentModel.DataAnnotations;
using SiteManagement.API.DAL.Entities;

namespace SiteManagement.API.BL.Models;

public record BookTimeSlotRequest(
    [Required]
    Guid PlannedDayId,

    [Required]
    Guid CourtId,

    [Required]
    [Range(1, 100)]
    int TimeSlotNumber,

    [Required]
    [Range(1, 53)]
    int WeekNumber,

    [Required]
    BookState BookState
);
