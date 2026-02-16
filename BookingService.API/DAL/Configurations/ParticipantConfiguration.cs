using Booking.API.DAL.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Booking.API.DAL.Configurations;

public class ParticipantConfiguration : IEntityTypeConfiguration<Participant>
{
    public void Configure(EntityTypeBuilder<Participant> builder)
    {
        builder.ToTable("Participants");

        builder.HasKey(p => p.Id);

        builder.Property(p => p.Id)
            .ValueGeneratedOnAdd();

        builder.Property(p => p.BookingId)
            .IsRequired();

        builder.Property(p => p.UserId)
            .IsRequired();

        builder.Property(p => p.HasPaid)
            .IsRequired()
            .HasDefaultValue(false);

        builder.Property(p => p.Team)
            .HasMaxLength(2)
            .IsRequired();

        // Indexes for common queries
        builder.HasIndex(p => p.BookingId);
        builder.HasIndex(p => p.UserId);
        builder.HasIndex(p => new { p.BookingId, p.UserId })
            .IsUnique(); // Ensure a user can only be a participant once per booking
    }
}