using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SiteManagement.API.DAL.Entities;

namespace SiteManagement.API.DAL.Configurations;

public class TimeSlotHistoryConfiguration : IEntityTypeConfiguration<TimeSlotHistory>
{
    public void Configure(EntityTypeBuilder<TimeSlotHistory> builder)
    {
        builder.ToTable("TimeSlotHistory");

        builder.HasKey(tsh => tsh.Id);

        builder.Property(tsh => tsh.PlannedDayId).IsRequired();
        builder.Property(tsh => tsh.CourtId).IsRequired();
        builder.Property(tsh => tsh.TimeSlotNumber).IsRequired();
        builder.Property(tsh => tsh.WeekNumber).IsRequired();
        builder.Property(tsh => tsh.Year).IsRequired();
        builder.Property(tsh => tsh.ArchivedAt).IsRequired();
        builder.Property(tsh => tsh.StartDateTime).IsRequired();

        builder.Property(tsh => tsh.FinalBookState)
            .IsRequired()
            .HasConversion<string>();

        // Supports audit queries like "all booked slots for court X in week Y/year Z"
        builder.HasIndex(tsh => new { tsh.CourtId, tsh.Year, tsh.WeekNumber });
    }
}