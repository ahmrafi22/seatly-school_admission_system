using SchoolAdmission.Api.Domain.Entities;

namespace SchoolAdmission.Api.Tests;

public class SeatAccountingTests
{
    private static Class NewClass(int totalSeats) => new()
    {
        Id = Guid.NewGuid(),
        Name = "Class 6 - Morning Shift",
        TotalSeats = totalSeats,
        CreatedAt = DateTimeOffset.UtcNow
    };

    [Fact]
    public void Available_seats_subtract_held_and_confirmed()
    {
        var c = NewClass(120);
        c.HeldCount = 15;
        c.ConfirmedCount = 80;

        Assert.Equal(25, c.AvailableSeats);
    }

    [Fact]
    public void Available_seats_is_zero_when_full()
    {
        var c = NewClass(10);
        c.HeldCount = 4;
        c.ConfirmedCount = 6;

        Assert.Equal(0, c.AvailableSeats);
    }

    [Fact]
    public void Hold_is_active_only_while_held_and_unexpired()
    {
        var now = DateTimeOffset.UtcNow;

        var live = NewHold(HoldStatus.HELD, now.AddMinutes(5));
        Assert.True(live.IsActive(now));

        var lapsed = NewHold(HoldStatus.HELD, now.AddSeconds(-1));
        Assert.False(lapsed.IsActive(now));

        var confirmed = NewHold(HoldStatus.CONFIRMED, now.AddMinutes(5));
        Assert.False(confirmed.IsActive(now));

        var cancelled = NewHold(HoldStatus.CANCELLED, now.AddMinutes(5));
        Assert.False(cancelled.IsActive(now));
    }

    private static Hold NewHold(HoldStatus status, DateTimeOffset expiresAt) => new()
    {
        Id = Guid.NewGuid(),
        ClassId = Guid.NewGuid(),
        StudentId = "20152691234567890",
        Status = status,
        ExpiresAt = expiresAt,
        CreatedAt = DateTimeOffset.UtcNow
    };
}
