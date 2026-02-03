using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;

namespace Authentication.API.DAL;

/// <summary>
/// Factory for creating AuthDbContext during design-time operations (migrations).
/// </summary>
public class AuthDbContextFactory : IDesignTimeDbContextFactory<AuthDbContext>
{
    public AuthDbContext CreateDbContext(string[] args)
    {
        var optionsBuilder = new DbContextOptionsBuilder<AuthDbContext>();

        // Use a dummy connection string for migration generation only
        optionsBuilder.UseSqlServer("Server=.;Database=AuthDb_Design;Trusted_Connection=True;TrustServerCertificate=True");

        return new AuthDbContext(optionsBuilder.Options);
    }
}