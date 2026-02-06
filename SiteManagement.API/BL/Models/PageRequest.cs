using ToolBox.EntityFramework.Filters;

namespace SiteManagement.API.BL.Models;

public record PageRequest
{
    public int PageNumber { get; init; } = 1;

    public int PageSize { get; init; } = 10;

    public IEnumerable<FilterGroup>? Filters { get; init; }
}