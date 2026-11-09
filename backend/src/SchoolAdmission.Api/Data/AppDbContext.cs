using Microsoft.EntityFrameworkCore;
using SchoolAdmission.Api.Domain.Entities;

namespace SchoolAdmission.Api.Data;

public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    public DbSet<Class> Classes => Set<Class>();
    public DbSet<Hold> Holds => Set<Hold>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<Class>(e =>
        {
            e.ToTable("classes");
            e.HasKey(x => x.Id);

            e.Property(x => x.Name).HasMaxLength(200).IsRequired();
            e.Property(x => x.TotalSeats).IsRequired();
            e.Property(x => x.HeldCount).IsRequired();
            e.Property(x => x.ConfirmedCount).IsRequired();
            e.Property(x => x.CreatedAt).IsRequired();

            e.Ignore(x => x.AvailableSeats);

            // Hard safety net: a logic bug fails loudly instead of overselling.
            e.ToTable(t => t.HasCheckConstraint(
                "ck_classes_seat_inventory",
                "\"HeldCount\" >= 0 AND \"ConfirmedCount\" >= 0 AND \"HeldCount\" + \"ConfirmedCount\" <= \"TotalSeats\""));

            e.HasIndex(x => x.Name);
        });

        modelBuilder.Entity<Hold>(e =>
        {
            e.ToTable("holds");
            e.HasKey(x => x.Id);

            e.Property(x => x.StudentId).HasMaxLength(32).IsRequired();
            e.Property(x => x.Status).HasConversion<string>().HasMaxLength(20).IsRequired();
            e.Property(x => x.ExpiresAt).IsRequired();
            e.Property(x => x.CreatedAt).IsRequired();

            e.HasOne(x => x.Class)
                .WithMany(x => x.Holds)
                .HasForeignKey(x => x.ClassId)
                .OnDelete(DeleteBehavior.Restrict);

            // One student can hold at most one active seat per class.
            e.HasIndex(x => new { x.ClassId, x.StudentId })
                .IsUnique()
                .HasFilter("\"Status\" IN ('HELD', 'CONFIRMED')")
                .HasDatabaseName("ux_holds_active_per_student_class");

            e.HasIndex(x => new { x.StudentId, x.Status });
            e.HasIndex(x => new { x.Status, x.ExpiresAt });
        });
    }
}
