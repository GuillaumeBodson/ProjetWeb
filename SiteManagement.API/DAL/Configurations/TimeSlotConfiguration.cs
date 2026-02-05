using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SiteManagement.API.DAL.Entities;

namespace SiteManagement.API.DAL.Configurations;

public class TimeSlotConfiguration : IEntityTypeConfiguration<TimeSlot>
{
    public void Configure(EntityTypeBuilder<TimeSlot> builder)
    {
        builder.HasKey(ts => ts.Id);

        builder.Property(ts => ts.PlannedDayId)
            .IsRequired();

        builder.Property(ts => ts.CourtId)
            .IsRequired();

        builder.Property(ts => ts.TimeSlotNumber)
            .IsRequired();

        builder.Property(ts => ts.BookState)
            .IsRequired()
            .HasConversion<string>();

        builder.Property(ts => ts.WeekNumber)
            .IsRequired();

        builder.HasIndex(ts => new { ts.PlannedDayId, ts.TimeSlotNumber, ts.CourtId, ts.WeekNumber })
            .IsUnique();
    }
}
