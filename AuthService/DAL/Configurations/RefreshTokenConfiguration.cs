using Authentication.API.DAL.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Authentication.API.DAL.Configurations;

public class RefreshTokenConfiguration : IEntityTypeConfiguration<RefreshToken>
{
    public void Configure(EntityTypeBuilder<RefreshToken> builder)
    {
        builder.HasKey(e => e.Id);

        builder.Property(e => e.Token)
               .IsRequired();

        builder.HasIndex(e => e.Token)
               .IsUnique();

        builder.HasIndex(e => e.UserId);

        builder.HasOne<User>()
               .WithMany()
               .HasForeignKey(e => e.UserId)
               .OnDelete(DeleteBehavior.Cascade);
    }
}