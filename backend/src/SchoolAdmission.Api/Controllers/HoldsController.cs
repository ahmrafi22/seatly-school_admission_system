using Microsoft.AspNetCore.Mvc;
using SchoolAdmission.Api.Configuration;
using SchoolAdmission.Api.Contracts;
using SchoolAdmission.Api.Domain.Entities;
using SchoolAdmission.Api.Services;

namespace SchoolAdmission.Api.Controllers;

[ApiController]
[Route("holds")]
public class HoldsController(SeatAllocationService seats) : ControllerBase
{
    /// <summary>
    /// Applies for a seat, creating a temporary hold. Returns 409 when the class
    /// is full or the student already has an active application there.
    /// </summary>
    [HttpPost("/classes/{classId:guid}/holds")]
    [ProducesResponseType(typeof(HoldResponse), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<IActionResult> Create(Guid classId, CancellationToken ct)
    {
        var studentId = StudentIdHeader.From(Request);
        if (studentId is null)
        {
            return MissingStudentId();
        }

        var result = await seats.CreateHoldAsync(classId, studentId, ct);
        if (!result.IsSuccess)
        {
            return MapFailure(result);
        }

        var hold = result.Value!;
        var body = new HoldResponse(
            hold.Id.ToString(),
            hold.ClassId.ToString(),
            hold.StudentId,
            hold.Status.ToString(),
            hold.ExpiresAt);

        return CreatedAtAction(nameof(GetById), new { holdId = hold.Id }, body);
    }

    /// <summary>Returns the current status of one application.</summary>
    [HttpGet("{holdId:guid}")]
    [ProducesResponseType(typeof(HoldDetailResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetById(Guid holdId, CancellationToken ct)
    {
        var result = await seats.GetHoldAsync(holdId, ct);
        if (!result.IsSuccess)
        {
            return MapFailure(result);
        }

        var hold = result.Value!;
        Response.Headers.CacheControl = "no-store";

        return Ok(new HoldDetailResponse(
            hold.Id.ToString(),
            hold.ClassId.ToString(),
            hold.Status.ToString(),
            hold.ExpiresAt));
    }

    /// <summary>
    /// Confirms an admission after payment. Idempotent: repeating the call
    /// succeeds and does not increment confirmedSeats twice.
    /// </summary>
    [HttpPost("{holdId:guid}/confirm")]
    [ProducesResponseType(typeof(ConfirmHoldResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<IActionResult> Confirm(Guid holdId, CancellationToken ct)
    {
        var studentId = StudentIdHeader.From(Request);
        if (studentId is null)
        {
            return MissingStudentId();
        }

        var result = await seats.ConfirmHoldAsync(holdId, studentId, ct);
        if (!result.IsSuccess)
        {
            return MapFailure(result);
        }

        var hold = result.Value!;
        return Ok(new ConfirmHoldResponse(hold.Id.ToString(), hold.Status.ToString()));
    }

    /// <summary>Cancels a held application, returning the seat to the pool.</summary>
    [HttpDelete("{holdId:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<IActionResult> Cancel(Guid holdId, CancellationToken ct)
    {
        var studentId = StudentIdHeader.From(Request);
        if (studentId is null)
        {
            return MissingStudentId();
        }

        var result = await seats.CancelHoldAsync(holdId, studentId, ct);
        if (!result.IsSuccess)
        {
            return MapFailure(result);
        }

        return NoContent();
    }

    private ObjectResult MissingStudentId() => Problem(
        title: "Missing student identity",
        detail: $"The {StudentIdHeader.HeaderName} header is required and must be exactly 17 digits.",
        statusCode: StatusCodes.Status400BadRequest);

    /// <summary>Maps a domain failure to a status code plus readable detail.</summary>
    private ObjectResult MapFailure<T>(SeatResult<T> result) => result.Outcome switch
    {
        SeatOutcome.NotFound => Problem(
            title: "Not found",
            detail: result.Message,
            statusCode: StatusCodes.Status404NotFound),

        SeatOutcome.ClassFull => Problem(
            title: "No seats available",
            detail: result.Message,
            statusCode: StatusCodes.Status409Conflict),

        SeatOutcome.DuplicateActiveApplication => Problem(
            title: "Duplicate application",
            detail: result.Message,
            statusCode: StatusCodes.Status409Conflict),

        SeatOutcome.AlreadyExpired => Problem(
            title: "Application expired",
            detail: result.Message,
            statusCode: StatusCodes.Status409Conflict),

        SeatOutcome.InvalidState => Problem(
            title: "Invalid application state",
            detail: result.Message,
            statusCode: StatusCodes.Status409Conflict),

        _ => Problem(
            title: "Unexpected error",
            detail: "Something went wrong while processing this request.",
            statusCode: StatusCodes.Status500InternalServerError)
    };
}
