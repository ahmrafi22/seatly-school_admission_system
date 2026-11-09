namespace SchoolAdmission.Api.Domain.Entities;

/// <summary>
/// A class (name + shift) with a fixed seat inventory.
/// The seat counters are authoritative and are only mutated while the
/// class row is locked, so held + confirmed can never exceed total seats.
/// </summary>
public class Class
{
    public Guid Id { get; set; }

    public required string Name { get; set; }

    public int TotalSeats { get; set; }

    /// <summary>Seats currently reserved by unexpired holds.</summary>
    public int HeldCount { get; set; }

    /// <summary>Seats permanently taken by confirmed admissions.</summary>
    public int ConfirmedCount { get; set; }

    public DateTimeOffset CreatedAt { get; set; }

    public ICollection<Hold> Holds { get; set; } = new List<Hold>();

    public int AvailableSeats => TotalSeats - HeldCount - ConfirmedCount;
}
