using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;

namespace SiteManagement.API.DAL;

/// <summary>
/// Factory for creating SiteManagementDbContext during design-time operations (migrations).
/// </summary>
public class SiteManagementDbContextFactory : IDesignTimeDbContextFactory<SiteManagementDbContext>
{
    public SiteManagementDbContext CreateDbContext(string[] args)
    {
        var optionsBuilder = new DbContextOptionsBuilder<SiteManagementDbContext>();
        
        // Use a dummy connection string for migration generation only
        optionsBuilder.UseSqlServer("Server=.;Database=SiteManagementDb_Design;Trusted_Connection=True;TrustServerCertificate=True");

        return new SiteManagementDbContext(optionsBuilder.Options);
    }
}
