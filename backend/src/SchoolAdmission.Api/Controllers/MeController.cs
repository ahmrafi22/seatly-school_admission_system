using Microsoft.AspNetCore.Mvc;
using SchoolAdmission.Api.Configuration;
using SchoolAdmission.Api.Contracts;
using SchoolAdmission.Api.Services;

namespace SchoolAdmission.Api.Controllers;

[ApiController]
[Route("me")]
public class MeController(SeatAllocationService seats) : ControllerBase
{
    /// <summary>
    /// Lists the caller's applications, including lapsed ones. A lapsed hold is
    /// reported as EXPIRED here even though the row is only rewritten to EXPIRED
    /// the next time a write path reclaims it.
    /// </summary>
    [HttpGet("holds")]
    [ProducesResponseType(typeof(IEnumerable<MyHoldResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> MyHolds(CancellationToken ct)
    {
        var studentId = StudentIdHeader.From(Request);
        if (studentId is null)
        {
            return Problem(
                title: "Missing student identity",
                detail: $"The {StudentIdHeader.HeaderName} header is required and must be exactly 17 digits.",
                statusCode: StatusCodes.Status400BadRequest);
        }

        var holds = await seats.ListMyHoldsAsync(studentId, ct);

        Response.Headers.CacheControl = "no-store";

        return Ok(holds.Select(h => new MyHoldResponse(
            h.Id.ToString(),
            h.ClassId.ToString(),
            h.Class?.Name ?? string.Empty,
            h.Status.ToString(),
            h.ExpiresAt)));
    }
}
