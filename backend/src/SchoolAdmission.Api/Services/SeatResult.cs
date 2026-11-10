namespace SchoolAdmission.Api.Services;

/// <summary>
/// Why a seat operation did not succeed. Controllers map these to HTTP codes.
/// </summary>
public enum SeatOutcome
{
    Success,

    /// <summary>Class or hold does not exist, or does not belong to the caller.</summary>
    NotFound,

    /// <summary>held + confirmed already equals totalSeats.</summary>
    ClassFull,

    /// <summary>Student already has a HELD or CONFIRMED application in this class.</summary>
    DuplicateActiveApplication,

    /// <summary>The hold lapsed before the operation.</summary>
    AlreadyExpired,

    /// <summary>Terminal state that cannot transition the requested way.</summary>
    InvalidState
}

public readonly record struct SeatResult<T>(SeatOutcome Outcome, T? Value, string? Message)
{
    public bool IsSuccess => Outcome == SeatOutcome.Success;

    public static SeatResult<T> Ok(T value) => new(SeatOutcome.Success, value, null);

    public static SeatResult<T> Fail(SeatOutcome outcome, string message) =>
        new(outcome, default, message);
}
