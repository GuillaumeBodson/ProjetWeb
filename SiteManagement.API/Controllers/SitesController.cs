using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SiteManagement.API.BL.Models;
using SiteManagement.API.BL.Services.Abstractions;
using ToolBox.EntityFramework.Filters;

namespace SiteManagement.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class SitesController(ISiteService siteService) : ControllerBase
{
    [HttpGet]
    [ProducesResponseType<IEnumerable<SiteResponse>>(StatusCodes.Status200OK)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> GetAll(CancellationToken cancellationToken)
    {
        var sites = await siteService.GetAllAsync(cancellationToken);
        return Ok(sites);
    }

    [HttpGet("{id:guid}")]
    [ProducesResponseType<SiteDetailsResponse>(StatusCodes.Status200OK)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetById(Guid id, CancellationToken cancellationToken)
    {
        var site = await siteService.GetByIdAsync(id, cancellationToken);
        
        if (site is null)
        {
            return NotFound();
        }

        return Ok(site);
    }

    [HttpPost("search")]
    [ProducesResponseType<PageOf<SiteResponse>>(StatusCodes.Status200OK)]
    [ProducesResponseType<ValidationProblemDetails>(StatusCodes.Status400BadRequest)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> Search([FromBody] PageRequest request, CancellationToken cancellationToken)
    {
        var page = await siteService.GetPageAsync(request, cancellationToken);
        return Ok(page);
    }

    [HttpPost]
    [ProducesResponseType<SiteDetailsResponse>(StatusCodes.Status201Created)]
    [ProducesResponseType<ValidationProblemDetails>(StatusCodes.Status400BadRequest)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> Create([FromBody] CreateSiteRequest request, CancellationToken cancellationToken)
    {
        var site = await siteService.CreateAsync(request, cancellationToken);
        return CreatedAtAction(nameof(GetById), new { id = site.Id }, site);
    }

    [HttpPut("{id:guid}")]
    [ProducesResponseType<SiteDetailsResponse>(StatusCodes.Status200OK)]
    [ProducesResponseType<ValidationProblemDetails>(StatusCodes.Status400BadRequest)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateSiteRequest request, CancellationToken cancellationToken)
    {
        var site = await siteService.UpdateAsync(id, request, cancellationToken);
        
        if (site is null)
        {
            return NotFound();
        }

        return Ok(site);
    }

    [HttpDelete("{id:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Delete(Guid id, CancellationToken cancellationToken)
    {
        var deleted = await siteService.DeleteAsync(id, cancellationToken);
        
        if (!deleted)
        {
            return NotFound();
        }

        return NoContent();
    }

    [HttpPost("{siteId:guid}/timeslots/book")]
    [ProducesResponseType<TimeSlotResponse>(StatusCodes.Status200OK)]
    [ProducesResponseType<ValidationProblemDetails>(StatusCodes.Status400BadRequest)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> BookTimeSlot(Guid siteId, [FromBody] BookTimeSlotRequest request, CancellationToken cancellationToken)
    {
        var timeSlot = await siteService.BookTimeSlotAsync(siteId, request, cancellationToken);

        if (timeSlot is null)
        {
            return NotFound();
        }

        return Ok(timeSlot);
    }
}
