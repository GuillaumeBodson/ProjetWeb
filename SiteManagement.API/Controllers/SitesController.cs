using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SiteManagement.API.BL.Models;
using SiteManagement.API.BL.Services.Abstractions;

namespace SiteManagement.API.Controllers;

[ApiController]
[AllowAnonymous]
[Route("api/[controller]")]
public class SitesController(ISiteService siteService) : ControllerBase
{
    [HttpGet]
    [ProducesResponseType<IEnumerable<SiteResponse>>(StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAll(CancellationToken cancellationToken)
    {
        var sites = await siteService.GetAllAsync(cancellationToken);
        return Ok(sites);
    }

    [HttpGet("{id:guid}")]
    [ProducesResponseType<SiteResponse>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetById(Guid id, CancellationToken cancellationToken)
    {
        var site = await siteService.GetByIdAsync(id, cancellationToken);
        
        if (site is null)
        {
            return NotFound();
        }

        return Ok(site);
    }
    [AllowAnonymous]
    [HttpPost]
    [ProducesResponseType<SiteResponse>(StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Create([FromBody] CreateSiteRequest request, CancellationToken cancellationToken)
    {
        var site = await siteService.CreateAsync(request, cancellationToken);
        return CreatedAtAction(nameof(GetById), new { id = site.Id }, site);
    }

    [HttpPut("{id:guid}")]
    [ProducesResponseType<SiteResponse>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
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
    [ProducesResponseType(StatusCodes.Status404NotFound)]
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
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
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
