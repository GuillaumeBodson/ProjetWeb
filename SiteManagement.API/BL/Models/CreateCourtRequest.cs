using System.ComponentModel.DataAnnotations;

namespace SiteManagement.API.BL.Models;

public record CreateCourtRequest(
    [Required]
    [Range(1, 100)]
    int Number
);
