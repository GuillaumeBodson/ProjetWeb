using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SiteManagement.API.DAL.Entities;

namespace SiteManagement.API.DAL.Configurations;

public class CourtConfiguration : IEntityTypeConfiguration<Court>
{
    public void Configure(EntityTypeBuilder<Court> builder)
    {
        builder.HasKey(c => c.Id);

        builder.Property(c => c.SiteId)
            .IsRequired();

        builder.Property(c => c.Number)
            .IsRequired();

        // Configure relationship with Site (defined in SiteConfiguration)
        // Configure relationship with TimeSlots
        builder.HasMany(c => c.TimeSlots)
            .WithOne(ts => ts.Court)
            .HasForeignKey(ts => ts.CourtId)
            .OnDelete(DeleteBehavior.Restrict);  // Prevent cascade conflicts

        builder.HasIndex(c => new { c.SiteId, c.Number })
            .IsUnique();
    }
}
