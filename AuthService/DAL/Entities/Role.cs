using System.ComponentModel.DataAnnotations;

namespace Authentication.API.DAL.Entities;

public class Role
{
    public Guid Id { get; set; }

    [Required]
    public RoleType RoleType { get; set; } = RoleType.User;

    /// <summary>
    /// For site-specific roles (UserPremium, Admin). Null for global roles.
    /// </summary>
    public Guid? SiteId { get; set; }

    public Guid UserId { get; set; }
    public User User { get; set; } = null!;
}