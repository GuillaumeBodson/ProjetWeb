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
);
