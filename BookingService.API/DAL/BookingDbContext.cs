using BookingEntity = Booking.API.DAL.Entities.Booking;
using Microsoft.EntityFrameworkCore;

namespace Booking.API.DAL;

// dotnet ef migrations add InitialCreate --project BookingService.API/Booking.API.csproj --startup-project BookingService.API/Booking.API.csproj
public class BookingDbContext(DbContextOptions<BookingDbContext> options) : DbContext(options)
{
    public DbSet<BookingEntity> Bookings { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(BookingDbContext).Assembly);
    }
}
