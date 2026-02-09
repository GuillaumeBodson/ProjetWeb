using Microsoft.EntityFrameworkCore;
using SiteManagement.API.DAL.Entities;

namespace SiteManagement.API.DAL;

// dotnet ef migrations add AddRevenueProperty --project SiteManagement.API/SiteManagement.API.csproj --startup-project SiteManagement.API/SiteManagement.API.csproj
public class SiteManagementDbContext(DbContextOptions<SiteManagementDbContext> options) : DbContext(options)
{
    public DbSet<Site> Sites { get; set; }
    public DbSet<Court> Courts { get; set; }
    public DbSet<PlannedDay> PlannedDays { get; set; }
    public DbSet<TimeSlot> TimeSlots { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(SiteManagementDbContext).Assembly);
    }
}


