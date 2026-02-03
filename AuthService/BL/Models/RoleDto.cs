namespace Authentication.API.BL.Models;

public class RoleDto
{
    public string RoleType { get; set; } = string.Empty;
    public Guid? SiteId { get; set; }
}
