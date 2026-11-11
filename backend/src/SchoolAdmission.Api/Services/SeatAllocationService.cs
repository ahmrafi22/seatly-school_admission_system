using System.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage;
using Npgsql;
using SchoolAdmission.Api.Configuration;
using SchoolAdmission.Api.Data;
using SchoolAdmission.Api.Domain.Entities;

namespace SchoolAdmission.Api.Services;

/// <summary>
/// All seat accounting lives here.
///
/// Every mutation takes a row lock on the owning <c>classes</c> row
/// (<c>SELECT ... FOR UPDATE</c>) before reading or writing counters. Postgres
/// serialises those transactions, so <c>held + confirmed &lt;= totalSeats</c>
/// holds even when several API processes share one database.
///
/// Lapsed holds are reclaimed lazily inside the same transaction, before
/// capacity is evaluated.
/// </summary>
public class SeatAllocationService(
    AppDbContext db,
    AppOptions options,
    ILogger<SeatAllocationService> logger)
{
    private const string PostgresUniqueViolation = "23505";

    // ----------------------------------------------------------------- classes

    public async Task<Class> CreateClassAsync(string name, int totalSeats, CancellationToken ct)
    {
        var entity = new Class
        {
            Id = Guid.NewGuid(),
            Name = name,
            TotalSeats = totalSeats,
            HeldCount = 0,
            ConfirmedCount = 0,
            CreatedAt = DateTimeOffset.UtcNow
        };

        db.Classes.Add(entity);
        await db.SaveChangesAsync(ct);
        return entity;
    }

    public async Task<List<Class>> ListClassesAsync(CancellationToken ct)
    {
        // Reclaim first so the counts returned are not stale.
        var ids = await db.Classes.AsNoTracking().Select(c => c.Id).ToListAsync(ct);
        foreach (var id in ids)
        {
            await ReclaimExpiredAsync(id, DateTimeOffset.UtcNow, ct);
        }

        return await db.Classes.AsNoTracking().OrderBy(c => c.CreatedAt).ToListAsync(ct);
    }

    public async Task<Class?> GetClassAsync(Guid classId, CancellationToken ct)
    {
        var exists = await db.Classes.AsNoTracking().AnyAsync(c => c.Id == classId, ct);
        if (!exists) return null;

        await ReclaimExpiredAsync(classId, DateTimeOffset.UtcNow, ct);
        return await db.Classes.AsNoTracking().FirstOrDefaultAsync(c => c.Id == classId, ct);
    }

    // ------------------------------------------------------------------- holds

    /// <summary>
    /// Reserves a seat. Returns ClassFull when the class has no capacity, and
    /// DuplicateActiveApplication when the student already holds one.
    /// </summary>
    public async Task<SeatResult<Hold>> CreateHoldAsync(Guid classId, string studentId, CancellationToken ct)
    {
        await using var tx = await db.Database.BeginTransactionAsync(ct);

        var cls = await LockClassAsync(classId, ct);
        if (cls is null)
        {
            return SeatResult<Hold>.Fail(SeatOutcome.NotFound, "That class does not exist.");
        }

        // Return lapsed seats before evaluating capacity.
        await ReclaimExpiredLockedAsync(cls, DateTimeOffset.UtcNow, ct);

        if (cls.HeldCount + cls.ConfirmedCount >= cls.TotalSeats)
        {
            return SeatResult<Hold>.Fail(
                SeatOutcome.ClassFull,
                $"No seats left in \"{cls.Name}\". All {cls.TotalSeats} seats are taken.");
        }

        var alreadyActive = await db.Holds.AnyAsync(
            h => h.ClassId == classId
                 && h.StudentId == studentId
                 && (h.Status == HoldStatus.HELD || h.Status == HoldStatus.CONFIRMED),
            ct);

        if (alreadyActive)
        {
            return SeatResult<Hold>.Fail(
                SeatOutcome.DuplicateActiveApplication,
                "You already have an active application in this class.");
        }

        var now = DateTimeOffset.UtcNow;
        var hold = new Hold
        {
            Id = Guid.NewGuid(),
            ClassId = classId,
            StudentId = studentId,
            Status = HoldStatus.HELD,
            CreatedAt = now,
            ExpiresAt = now.Add(options.HoldDuration)
        };

        cls.HeldCount += 1;
        db.Holds.Add(hold);

        try
        {
            await db.SaveChangesAsync(ct);
        }
        catch (DbUpdateException ex) when (IsUniqueViolation(ex))
        {
            // The partial unique index caught a duplicate that slipped past the
            // check, e.g. a concurrent insert in another process.
            return SeatResult<Hold>.Fail(
                SeatOutcome.DuplicateActiveApplication,
                "You already have an active application in this class.");
        }

        await tx.CommitAsync(ct);
        return SeatResult<Hold>.Ok(hold);
    }

    public async Task<SeatResult<Hold>> GetHoldAsync(Guid holdId, CancellationToken ct)
    {
        var hold = await db.Holds.AsNoTracking().FirstOrDefaultAsync(h => h.Id == holdId, ct);
        if (hold is null)
        {
            return SeatResult<Hold>.Fail(SeatOutcome.NotFound, "That application does not exist.");
        }

        // Reflect expiry for lapsed holds without a separate API call.
        if (hold.Status == HoldStatus.HELD && hold.ExpiresAt <= DateTimeOffset.UtcNow)
        {
            await ReclaimExpiredAsync(hold.ClassId, DateTimeOffset.UtcNow, ct);
            hold = await db.Holds.AsNoTracking().FirstAsync(h => h.Id == holdId, ct);
        }

        return SeatResult<Hold>.Ok(hold);
    }

    /// <summary>
    /// Confirms a hold. Idempotent: confirming an already-confirmed hold
    /// succeeds without incrementing ConfirmedCount again.
    /// </summary>
    public async Task<SeatResult<Hold>> ConfirmHoldAsync(Guid holdId, string studentId, CancellationToken ct)
    {
        await using var tx = await db.Database.BeginTransactionAsync(ct);

        var classId = await db.Holds.AsNoTracking()
            .Where(h => h.Id == holdId)
            .Select(h => (Guid?)h.ClassId)
            .FirstOrDefaultAsync(ct);

        if (classId is null)
        {
            return SeatResult<Hold>.Fail(SeatOutcome.NotFound, "That application does not exist.");
        }

        var cls = await LockClassAsync(classId.Value, ct);
        if (cls is null)
        {
            return SeatResult<Hold>.Fail(SeatOutcome.NotFound, "That class no longer exists.");
        }

        // Re-read under the lock so we act on current values.
        var hold = await db.Holds.FirstAsync(h => h.Id == holdId, ct);

        if (!string.Equals(hold.StudentId, studentId, StringComparison.Ordinal))
        {
            // Do not leak whether another student's hold exists.
            return SeatResult<Hold>.Fail(SeatOutcome.NotFound, "That application does not exist.");
        }

        if (hold.Status == HoldStatus.CONFIRMED)
        {
            // Idempotent success: no counter change.
            await tx.CommitAsync(ct);
            return SeatResult<Hold>.Ok(hold);
        }

        if (hold.Status != HoldStatus.HELD)
        {
            return SeatResult<Hold>.Fail(
                SeatOutcome.InvalidState,
                $"This application is already {hold.Status.ToString().ToLowerInvariant()} and cannot be confirmed.");
        }

        var now = DateTimeOffset.UtcNow;
        if (hold.ExpiresAt <= now)
        {
            hold.Status = HoldStatus.EXPIRED;
            cls.HeldCount = Math.Max(0, cls.HeldCount - 1);
            await db.SaveChangesAsync(ct);
            await tx.CommitAsync(ct);

            return SeatResult<Hold>.Fail(
                SeatOutcome.AlreadyExpired,
                "The hold expired before payment. Apply again for a new seat.");
        }

        hold.Status = HoldStatus.CONFIRMED;
        hold.ConfirmedAt = now;
        cls.HeldCount = Math.Max(0, cls.HeldCount - 1);
        cls.ConfirmedCount += 1;

        await db.SaveChangesAsync(ct);
        await tx.CommitAsync(ct);

        return SeatResult<Hold>.Ok(hold);
    }

    /// <summary>Cancels a HELD application, returning the seat to the pool.</summary>
    public async Task<SeatResult<Hold>> CancelHoldAsync(Guid holdId, string studentId, CancellationToken ct)
    {
        await using var tx = await db.Database.BeginTransactionAsync(ct);

        var classId = await db.Holds.AsNoTracking()
            .Where(h => h.Id == holdId)
            .Select(h => (Guid?)h.ClassId)
            .FirstOrDefaultAsync(ct);

        if (classId is null)
        {
            return SeatResult<Hold>.Fail(SeatOutcome.NotFound, "That application does not exist.");
        }

        var cls = await LockClassAsync(classId.Value, ct);
        if (cls is null)
        {
            return SeatResult<Hold>.Fail(SeatOutcome.NotFound, "That class no longer exists.");
        }

        var hold = await db.Holds.FirstAsync(h => h.Id == holdId, ct);

        if (!string.Equals(hold.StudentId, studentId, StringComparison.Ordinal))
        {
            return SeatResult<Hold>.Fail(SeatOutcome.NotFound, "That application does not exist.");
        }

        if (hold.Status == HoldStatus.CANCELLED)
        {
            await tx.CommitAsync(ct);
            return SeatResult<Hold>.Ok(hold);
        }

        if (hold.Status != HoldStatus.HELD)
        {
            return SeatResult<Hold>.Fail(
                SeatOutcome.InvalidState,
                hold.Status == HoldStatus.CONFIRMED
                    ? "A confirmed admission cannot be cancelled."
                    : "This application has already expired.");
        }

        if (hold.ExpiresAt <= DateTimeOffset.UtcNow)
        {
            hold.Status = HoldStatus.EXPIRED;
            cls.HeldCount = Math.Max(0, cls.HeldCount - 1);
            await db.SaveChangesAsync(ct);
            await tx.CommitAsync(ct);

            return SeatResult<Hold>.Fail(
                SeatOutcome.AlreadyExpired,
                "This application has already expired.");
        }

        hold.Status = HoldStatus.CANCELLED;
        cls.HeldCount = Math.Max(0, cls.HeldCount - 1);

        await db.SaveChangesAsync(ct);
        await tx.CommitAsync(ct);

        return SeatResult<Hold>.Ok(hold);
    }

    public async Task<List<Hold>> ListMyHoldsAsync(string studentId, CancellationToken ct)
    {
        var holds = await db.Holds
            .AsNoTracking()
            .Include(h => h.Class)
            .Where(h => h.StudentId == studentId)
            .OrderByDescending(h => h.CreatedAt)
            .ToListAsync(ct);

        var now = DateTimeOffset.UtcNow;
        foreach (var hold in holds)
        {
            if (hold.Status == HoldStatus.HELD && hold.ExpiresAt <= now)
            {
                hold.Status = HoldStatus.EXPIRED;
            }
        }

        return holds;
    }

    // --------------------------------------------------------------- internals

    /// <summary>
    /// Takes a row lock on the class and returns a tracked copy. Must be called
    /// inside a transaction. Raw SQL because LINQ cannot express FOR UPDATE; the
    /// row is then read with AsNoTracking so it is never a stale instance.
    /// </summary>
    private async Task<Class?> LockClassAsync(Guid classId, CancellationToken ct)
    {
        var connection = db.Database.GetDbConnection();
        if (connection.State != ConnectionState.Open)
        {
            await connection.OpenAsync(ct);
        }

        await using (var cmd = connection.CreateCommand())
        {
            cmd.Transaction = db.Database.CurrentTransaction?.GetDbTransaction();
            cmd.CommandText = """SELECT 1 FROM classes WHERE "Id" = @p0 FOR UPDATE""";

            var p = cmd.CreateParameter();
            p.ParameterName = "p0";
            p.Value = classId;
            cmd.Parameters.Add(p);

            var found = await cmd.ExecuteScalarAsync(ct);
            if (found is null) return null;
        }

        var cls = await db.Classes.AsNoTracking().FirstAsync(c => c.Id == classId, ct);
        db.Attach(cls);
        return cls;
    }

    /// <summary>
    /// Flips lapsed holds for one class to EXPIRED and releases their seats.
    /// Caller must already hold the class row lock.
    /// </summary>
    private async Task<int> ReclaimExpiredLockedAsync(Class cls, DateTimeOffset now, CancellationToken ct)
    {
        var reclaimed = await ExpireLapsedHoldsAsync(cls.Id, now, ct);
        if (reclaimed <= 0) return 0;

        cls.HeldCount = Math.Max(0, cls.HeldCount - reclaimed);
        await db.SaveChangesAsync(ct);

        logger.LogInformation(
            "Reclaimed {Count} expired hold(s) for class {ClassId}.", reclaimed, cls.Id);

        return reclaimed;
    }

    /// <summary>
    /// Standalone reclaim used by read paths. Takes its own transaction and lock
    /// so it never races a concurrent write.
    /// </summary>
    private async Task<int> ReclaimExpiredAsync(Guid classId, DateTimeOffset now, CancellationToken ct)
    {
        await using var tx = await db.Database.BeginTransactionAsync(ct);

        var cls = await LockClassAsync(classId, ct);
        if (cls is null) return 0;

        var reclaimed = await ReclaimExpiredLockedAsync(cls, now, ct);
        await tx.CommitAsync(ct);
        return reclaimed;
    }

    /// <summary>
    /// Atomic UPDATE ... RETURNING so the caller knows exactly how many seats
    /// to release.
    /// </summary>
    private async Task<int> ExpireLapsedHoldsAsync(Guid classId, DateTimeOffset now, CancellationToken ct)
    {
        var connection = db.Database.GetDbConnection();
        if (connection.State != ConnectionState.Open)
        {
            await connection.OpenAsync(ct);
        }

        await using var cmd = connection.CreateCommand();
        cmd.Transaction = db.Database.CurrentTransaction?.GetDbTransaction();
        cmd.CommandText = """
            WITH expired AS (
                UPDATE holds
                SET "Status" = 'EXPIRED'
                WHERE "ClassId" = @p0
                  AND "Status" = 'HELD'
                  AND "ExpiresAt" <= @p1
                RETURNING 1
            )
            SELECT COUNT(*)::int FROM expired
            """;

        var classParam = cmd.CreateParameter();
        classParam.ParameterName = "p0";
        classParam.Value = classId;
        cmd.Parameters.Add(classParam);

        var nowParam = cmd.CreateParameter();
        nowParam.ParameterName = "p1";
        nowParam.Value = now;
        cmd.Parameters.Add(nowParam);

        var result = await cmd.ExecuteScalarAsync(ct);
        return result is int count ? count : Convert.ToInt32(result ?? 0);
    }

    private static bool IsUniqueViolation(DbUpdateException ex) =>
        ex.InnerException is PostgresException pg && pg.SqlState == PostgresUniqueViolation;
}
