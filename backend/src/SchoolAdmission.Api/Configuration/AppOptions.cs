namespace SchoolAdmission.Api.Configuration;

/// <summary>
/// Application settings resolved from environment variables so the same image
/// can run locally, in compose, and on a VPS without code changes.
/// </summary>
public class AppOptions
{
    public const string SectionName = "App";

    /// <summary>
    /// How long a seat stays reserved after an application, in seconds.
    /// Env: HOLD_DURATION_SECONDS (default 600).
    /// </summary>
    public int HoldDurationSeconds { get; set; } = 600;

    /// <summary>
    /// Comma-separated list of allowed frontend origins.
    /// Env: CORS_ORIGINS.
    /// </summary>
    public string[] CorsOrigins { get; set; } = ["http://localhost:5173", "http://localhost:3000"];

    public TimeSpan HoldDuration => TimeSpan.FromSeconds(HoldDurationSeconds);
}
