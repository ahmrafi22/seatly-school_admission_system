using Microsoft.AspNetCore.Mvc;
using SchoolAdmission.Api.Contracts;
using SchoolAdmission.Api.Domain.Entities;
using SchoolAdmission.Api.Services;

namespace SchoolAdmission.Api.Controllers;

[ApiController]
[Route("classes")]
public class ClassesController(SeatAllocationService seats) : ControllerBase
{
    private const int MaxNameLength = 200;
    private const int MaxSeatsPerClass = 10_000;

    /// <summary>Creates a class with a fixed seat inventory.</summary>
    [HttpPost]
    [ProducesResponseType(typeof(ClassResponse), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Create([FromBody] CreateClassRequest request, CancellationToken ct)
    {
        var name = request.Name?.Trim() ?? string.Empty;

        if (string.IsNullOrWhiteSpace(name))
        {
            return Problem(
                title: "Invalid class name",
                detail: "A class name is required.",
                statusCode: StatusCodes.Status400BadRequest);
        }

        if (name.Length > MaxNameLength)
        {
            return Problem(
                title: "Invalid class name",
                detail: $"A class name cannot be longer than {MaxNameLength} characters.",
                statusCode: StatusCodes.Status400BadRequest);
        }

        if (request.TotalSeats < 1)
        {
            return Problem(
                title: "Invalid seat count",
                detail: "A class must have at least 1 seat.",
                statusCode: StatusCodes.Status400BadRequest);
        }

        if (request.TotalSeats > MaxSeatsPerClass)
        {
            return Problem(
                title: "Invalid seat count",
                detail: $"A class cannot have more than {MaxSeatsPerClass} seats.",
                statusCode: StatusCodes.Status400BadRequest);
        }

        var created = await seats.CreateClassAsync(name, request.TotalSeats, ct);
        var body = ToResponse(created);

        return CreatedAtAction(nameof(GetById), new { classId = created.Id }, body);
    }

    /// <summary>Lists all classes with live seat counts.</summary>
    [HttpGet]
    [ProducesResponseType(typeof(IEnumerable<ClassResponse>), StatusCodes.Status200OK)]
    public async Task<IActionResult> List(CancellationToken ct)
    {
        var classes = await seats.ListClassesAsync(ct);

        // Seat counts change constantly; never let a proxy serve a stale list.
        Response.Headers.CacheControl = "no-store";

        return Ok(classes.Select(ToResponse));
    }

    /// <summary>Returns a single class with live seat counts.</summary>
    [HttpGet("{classId:guid}")]
    [ProducesResponseType(typeof(ClassResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetById(Guid classId, CancellationToken ct)
    {
        var cls = await seats.GetClassAsync(classId, ct);
        if (cls is null)
        {
            return Problem(
                title: "Class not found",
                detail: "That class does not exist.",
                statusCode: StatusCodes.Status404NotFound);
        }

        Response.Headers.CacheControl = "no-store";
        return Ok(ToResponse(cls));
    }

    private static ClassResponse ToResponse(Class c) => new(
        c.Id.ToString(),
        c.Name,
        c.TotalSeats,
        c.HeldCount,
        c.ConfirmedCount,
        c.AvailableSeats);
}
