namespace SchoolAdmission.Api.Domain.Entities;

/// <summary>
/// A seat reservation. A hold consumes a seat from the moment it is created
/// and releases it when cancelled, expired, or converted to a confirmation.
/// </summary>
public class Hold
{
    public Guid Id { get; set; }

    public Guid ClassId { get; set; }

    public Class Class { get; set; } = null!;

    /// <summary>17-digit birth registration number supplied by the client.</summary>
    public required string StudentId { get; set; }

    public HoldStatus Status { get; set; }

    public DateTimeOffset ExpiresAt { get; set; }

    public DateTimeOffset CreatedAt { get; set; }

    public DateTimeOffset? ConfirmedAt { get; set; }

    /// <summary>
    /// A hold still occupies its seat only while it is HELD and has not lapsed.
    /// </summary>
    public bool IsActive(DateTimeOffset now) => Status == HoldStatus.HELD && ExpiresAt > now;
}
