namespace SchoolAdmission.Api.Contracts;

/// <summary>Response shape for a class, including live seat accounting.</summary>
public record ClassResponse(
    string Id,
    string Name,
    int TotalSeats,
    int HeldSeats,
    int ConfirmedSeats,
    int AvailableSeats);

public record CreateClassRequest(string Name, int TotalSeats);

public record HoldResponse(
    string HoldId,
    string ClassId,
    string StudentId,
    string Status,
    DateTimeOffset ExpiresAt);

public record HoldDetailResponse(
    string HoldId,
    string ClassId,
    string Status,
    DateTimeOffset ExpiresAt);

public record ConfirmHoldResponse(string HoldId, string Status);

public record MyHoldResponse(
    string HoldId,
    string ClassId,
    string ClassName,
    string Status,
    DateTimeOffset ExpiresAt);
