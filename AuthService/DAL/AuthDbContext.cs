using Authentication.API.DAL.Entities;
using Microsoft.EntityFrameworkCore;

namespace Authentication.API.DAL;

/*
# 1. Make entity/configuration changes
# 2. Create migration
dotnet ef migrations add Initial --project AuthService/Authentication.API.csproj --startup-project AuthService/Authentication.API.csproj

# 3. Run AppHost to test (migrations apply automatically)
# 4. Commit migration files with your feature
 */
public class AuthDbContext : DbContext
{
    public AuthDbContext(DbContextOptions<AuthDbContext> options)
        : base(options)
    {
    }

    public DbSet<User> Users { get; set; }
    public DbSet<RefreshToken> RefreshTokens { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(AuthDbContext).Assembly);
    }
}