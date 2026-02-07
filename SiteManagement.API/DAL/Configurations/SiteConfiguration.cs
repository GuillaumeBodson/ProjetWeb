using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SiteManagement.API.DAL.Entities;

namespace SiteManagement.API.DAL.Configurations;

public class SiteConfiguration : IEntityTypeConfiguration<Site>
{
    public void Configure(EntityTypeBuilder<Site> builder)
    {
        builder.HasKey(s => s.Id);

        builder.Property(s => s.Name)
            .IsRequired()
            .HasMaxLength(200);

        builder.Property(s => s.Revenue)
            .IsRequired()
            .HasColumnType("decimal(18,2)");

        builder.Property(s => s.ClosedDays)
            .HasConversion(
                v => string.Join(',', v.Select(d => d.ToString("O"))),
                v => v.Split(',', StringSplitOptions.RemoveEmptyEntries)
                    .Select(d => DateOnly.Parse(d))
                    .ToHashSet())
            .HasColumnType("nvarchar(max)");

        // Configure relationships using navigation properties
        builder.HasMany(s => s.PlannedDays)
            .WithOne(pd => pd.Site)
            .HasForeignKey(pd => pd.SiteId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasMany(s => s.Courts)
            .WithOne(c => c.Site)
            .HasForeignKey(c => c.SiteId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasIndex(s => s.Name);
    }
}
