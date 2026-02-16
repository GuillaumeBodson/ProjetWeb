using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;

namespace Booking.API.DAL;

public class BookingDbContextFactory : IDesignTimeDbContextFactory<BookingDbContext>
{
    public BookingDbContext CreateDbContext(string[] args)
    {
        var optionsBuilder = new DbContextOptionsBuilder<BookingDbContext>();

        // Use a temporary connection string for design-time operations
        optionsBuilder.UseSqlServer("Server=localhost;Database=BookingDb;Trusted_Connection=True;TrustServerCertificate=True;");

        return new BookingDbContext(optionsBuilder.Options);
    }
}
