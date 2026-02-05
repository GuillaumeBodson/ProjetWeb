using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SiteManagement.API.DAL.Entities;

namespace SiteManagement.API.DAL.Configurations;

public class PlannedDayConfiguration : IEntityTypeConfiguration<PlannedDay>
{
    public void Configure(EntityTypeBuilder<PlannedDay> builder)
    {
        builder.HasKey(pd => pd.Id);

        builder.Property(pd => pd.SiteId)
            .IsRequired();

        builder.Property(pd => pd.DayOfWeek)
            .IsRequired()
            .HasConversion<string>();

        builder.Property(pd => pd.NumberOfTimeSlots)
            .IsRequired()
            .HasMaxLength(2);

        // Configure relationship with Site (defined in SiteConfiguration)
        // Configure relationship with TimeSlots
        builder.HasMany(pd => pd.TimeSlots)
            .WithOne(ts => ts.PlannedDay)
            .HasForeignKey(ts => ts.PlannedDayId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasIndex(pd => new { pd.SiteId, pd.DayOfWeek })
            .IsUnique();
    }
}
