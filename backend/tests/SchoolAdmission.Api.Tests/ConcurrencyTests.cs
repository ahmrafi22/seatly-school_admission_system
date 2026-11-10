using Microsoft.EntityFrameworkCore;
using SchoolAdmission.Api.Configuration;
using SchoolAdmission.Api.Data;
using SchoolAdmission.Api.Domain.Entities;
using SchoolAdmission.Api.Services;

namespace SchoolAdmission.Api.Tests;

/// <summary>
/// Concurrency tests. These require a real PostgreSQL instance because the
/// guarantee under test is a database row lock, not an in-process lock.
///
/// Point them at a database with:
///   TEST_DATABASE_CONNECTION=Host=localhost;Port=5432;Database=school_admission_test;Username=postgres;Password=postgres
///
/// When that variable is absent the tests are skipped rather than failing, so a
/// plain `dotnet test` on a machine without Postgres still succeeds.
/// </summary>
public class ConcurrencyTests : IAsyncLifetime
{
    private const string EnvVar = "TEST_DATABASE_CONNECTION";

    private readonly string? _connectionString =
        Environment.GetEnvironmentVariable(EnvVar);

    private bool CanRun => !string.IsNullOrWhiteSpace(_connectionString);

    private AppOptions _options = new();
    private DbContextOptions<AppDbContext> _dbOptions = null!;

    public Task InitializeAsync()
    {
        if (!CanRun) return Task.CompletedTask;

        _dbOptions = new DbContextOptionsBuilder<AppDbContext>()
            .UseNpgsql(_connectionString)
            .Options;

        using var db = new AppDbContext(_dbOptions);
        db.Database.Migrate();
        return Task.CompletedTask;
    }

    public Task DisposeAsync() => Task.CompletedTask;

    private AppDbContext NewContext() => new(_dbOptions);

    private static SeatAllocationService NewService(AppDbContext db, AppOptions options) =>
        new(db, options, Microsoft.Extensions.Logging.Abstractions.NullLogger<SeatAllocationService>.Instance);

    private async Task<Class> SeedClassAsync(int totalSeats)
    {
        await using var db = NewContext();
        var svc = NewService(db, _options);
        return await svc.CreateClassAsync($"Concurrency {Guid.NewGuid():N}", totalSeats, default);
    }

    /// <summary>
    /// The headline requirement: N students race for M seats, and exactly M
    /// succeed. No overselling, no negative availability.
    /// </summary>
    [Fact]
    public async Task ParallelHolds_NeverExceedTotalSeats()
    {
        if (!CanRun) return;

        const int seats = 10;
        const int applicants = 50;

        var cls = await SeedClassAsync(seats);

        var results = await Task.WhenAll(
            Enumerable.Range(0, applicants).Select(async i =>
            {
                // Each applicant gets its own DbContext, mirroring separate requests.
                await using var db = NewContext();
                var svc = NewService(db, _options);
                var studentId = (10000000000000000L + i).ToString();
                return await svc.CreateHoldAsync(cls.Id, studentId, default);
            }));

        var succeeded = results.Count(r => r.IsSuccess);
        var full = results.Count(r => r.Outcome == SeatOutcome.ClassFull);

        Assert.Equal(seats, succeeded);
        Assert.Equal(applicants - seats, full);

        await using var verifyDb = NewContext();
        var reloaded = await verifyDb.Classes.AsNoTracking().FirstAsync(c => c.Id == cls.Id);

        Assert.Equal(seats, reloaded.HeldCount);
        Assert.Equal(0, reloaded.ConfirmedCount);
        Assert.Equal(0, reloaded.AvailableSeats);
        Assert.True(reloaded.HeldCount + reloaded.ConfirmedCount <= reloaded.TotalSeats);

        // And the database itself agrees.
        var activeHolds = await verifyDb.Holds
            .CountAsync(h => h.ClassId == cls.Id && h.Status == HoldStatus.HELD);
        Assert.Equal(seats, activeHolds);
    }

    /// <summary>
    /// Same guarantee but expressed against two independent service instances
    /// sharing one database, which is the "two backend processes" scenario.
    /// </summary>
    [Fact]
    public async Task TwoProcessesSharingOneDatabase_StillNeverOversell()
    {
        if (!CanRun) return;

        const int seats = 5;
        const int applicantsPerProcess = 20;

        var cls = await SeedClassAsync(seats);

        async Task<int> RunProcessAsync(int processIndex)
        {
            // Separate DbContext per call: no shared state between the two "processes".
            var tasks = Enumerable.Range(0, applicantsPerProcess).Select(async i =>
            {
                await using var db = NewContext();
                var svc = NewService(db, _options);
                var studentId = ((processIndex * 1000) + i + 20000000000000000L).ToString();
                var result = await svc.CreateHoldAsync(cls.Id, studentId, default);
                return result.IsSuccess ? 1 : 0;
            });

            var counts = await Task.WhenAll(tasks);
            return counts.Sum();
        }

        var totals = await Task.WhenAll(RunProcessAsync(0), RunProcessAsync(1));

        Assert.Equal(seats, totals.Sum());

        await using var db2 = NewContext();
        var reloaded = await db2.Classes.AsNoTracking().FirstAsync(c => c.Id == cls.Id);
        Assert.Equal(seats, reloaded.HeldCount);
        Assert.True(reloaded.HeldCount + reloaded.ConfirmedCount <= reloaded.TotalSeats);
    }

    /// <summary>
    /// Confirming the same hold many times in parallel must increment
    /// confirmedSeats exactly once.
    /// </summary>
    [Fact]
    public async Task ParallelConfirms_IncrementConfirmedSeatsOnce()
    {
        if (!CanRun) return;

        var cls = await SeedClassAsync(3);

        string holdId;
        await using (var db = NewContext())
        {
            var svc = NewService(db, _options);
            var created = await svc.CreateHoldAsync(cls.Id, "30000000000000001", default);
            Assert.True(created.IsSuccess);
            holdId = created.Value!.Id.ToString();
        }

        var id = Guid.Parse(holdId);

        await Task.WhenAll(Enumerable.Range(0, 20).Select(async _ =>
        {
            await using var db = NewContext();
            var svc = NewService(db, _options);
            await svc.ConfirmHoldAsync(id, "30000000000000001", default);
        }));

        await using var verifyDb = NewContext();
        var reloaded = await verifyDb.Classes.AsNoTracking().FirstAsync(c => c.Id == cls.Id);

        Assert.Equal(1, reloaded.ConfirmedCount);
        Assert.Equal(0, reloaded.HeldCount);

        var hold = await verifyDb.Holds.AsNoTracking().FirstAsync(h => h.Id == id);
        Assert.Equal(HoldStatus.CONFIRMED, hold.Status);
    }

    /// <summary>
    /// A student cannot end up with two active applications in one class even
    /// when both requests arrive at the same instant.
    /// </summary>
    [Fact]
    public async Task ParallelDuplicateApplications_OnlyOneWins()
    {
        if (!CanRun) return;

        var cls = await SeedClassAsync(10);
        const string studentId = "40000000000000001";

        var results = await Task.WhenAll(Enumerable.Range(0, 10).Select(async _ =>
        {
            await using var db = NewContext();
            var svc = NewService(db, _options);
            return await svc.CreateHoldAsync(cls.Id, studentId, default);
        }));

        Assert.Equal(1, results.Count(r => r.IsSuccess));

        await using var verifyDb = NewContext();
        var active = await verifyDb.Holds.CountAsync(
            h => h.ClassId == cls.Id
                 && h.StudentId == studentId
                 && (h.Status == HoldStatus.HELD || h.Status == HoldStatus.CONFIRMED));

        Assert.Equal(1, active);
    }

    /// <summary>
    /// Lapsed holds must free their seats even with no API call and no sweeper:
    /// the next applicant reclaims them inside the write transaction.
    /// </summary>
    [Fact]
    public async Task ExpiredHolds_ReleaseSeatsWithoutSweeper()
    {
        if (!CanRun) return;

        _options = new AppOptions { HoldDurationSeconds = 1 };
        var cls = await SeedClassAsync(1);

        await using (var db = NewContext())
        {
            var svc = NewService(db, _options);
            var first = await svc.CreateHoldAsync(cls.Id, "50000000000000001", default);
            Assert.True(first.IsSuccess);
        }

        await Task.Delay(TimeSpan.FromSeconds(2));

        await using (var db = NewContext())
        {
            var svc = NewService(db, _options);
            var second = await svc.CreateHoldAsync(cls.Id, "50000000000000002", default);
            Assert.True(second.IsSuccess);
        }

        await using var verifyDb = NewContext();
        var reloaded = await verifyDb.Classes.AsNoTracking().FirstAsync(c => c.Id == cls.Id);
        Assert.Equal(1, reloaded.HeldCount);
        Assert.Equal(0, reloaded.AvailableSeats);

        var expired = await verifyDb.Holds.CountAsync(
            h => h.ClassId == cls.Id && h.Status == HoldStatus.EXPIRED);
        Assert.Equal(1, expired);
    }
}
