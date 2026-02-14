using SiteManagement.API.BL.Models;
using ToolBox.EntityFramework.Filters;

namespace SiteManagement.API.BL.Services.Abstractions;

public interface ISiteService
{
    Task<SiteDetailsResponse?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<IEnumerable<SiteResponse>> GetAllAsync(CancellationToken cancellationToken = default);
    Task<SiteDetailsResponse> CreateAsync(CreateSiteRequest request, CancellationToken cancellationToken = default);
    Task<SiteDetailsResponse?> UpdateAsync(Guid id, UpdateSiteRequest request, CancellationToken cancellationToken = default);
    Task<bool> DeleteAsync(Guid id, CancellationToken cancellationToken = default);
    Task<TimeSlotResponse?> BookTimeSlotAsync(Guid siteId, BookTimeSlotRequest request, CancellationToken cancellationToken = default);
    Task<PageOf<SiteResponse>> GetPageAsync(PageRequest request, CancellationToken cancellationToken = default);
    Task<SiteDetailsResponse?> UpdateSiteScheduleAsync(Guid siteId, UpdateScheduleRequest request, CancellationToken cancellationToken);
}
