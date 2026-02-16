using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using BookingEntity = Booking.API.DAL.Entities.Booking;

namespace Booking.API.DAL.Configurations;

public class BookingConfiguration : IEntityTypeConfiguration<BookingEntity>
{
    public void Configure(EntityTypeBuilder<BookingEntity> builder)
    {
        builder.ToTable("Bookings");

        builder.HasKey(b => b.Id);

        builder.Property(b => b.Id)
            .ValueGeneratedOnAdd();

        builder.Property(b => b.CreatorId)
            .IsRequired();

        builder.Property(b => b.SiteId)
            .IsRequired();

        builder.Property(b => b.CourtId)
            .IsRequired();

        builder.Property(b => b.TimeSlotId)
            .IsRequired();

        builder.Property(b => b.BookingDate)
            .IsRequired();

        builder.Property(b => b.BookingType)
            .IsRequired()
            .HasConversion<string>();

        builder.Property(b => b.Status)
            .IsRequired()
            .HasConversion<string>();

        builder.Property(b => b.CreatedAt)
            .IsRequired()
            .HasDefaultValueSql("GETUTCDATE()");

        builder.Property(b => b.CancelledAt)
            .IsRequired(false);

        builder.Property(b => b.Participant2)
            .IsRequired(false);

        builder.Property(b => b.Participant3)
            .IsRequired(false);

        builder.Property(b => b.Participant4)
            .IsRequired(false);

        // Navigation property
        builder.HasMany(b => b.Participants)
            .WithOne()
            .HasForeignKey(p => p.BookingId)
            .OnDelete(DeleteBehavior.Cascade);

        // Indexes for common queries
        builder.HasIndex(b => b.CreatorId);
        builder.HasIndex(b => b.SiteId);
        builder.HasIndex(b => b.CourtId);
        builder.HasIndex(b => b.TimeSlotId);
        builder.HasIndex(b => b.BookingDate);
        builder.HasIndex(b => b.Status);
        builder.HasIndex(b => b.BookingType);
    }
}