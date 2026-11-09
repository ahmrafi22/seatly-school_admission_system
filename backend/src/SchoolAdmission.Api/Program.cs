using Microsoft.EntityFrameworkCore;
using SchoolAdmission.Api.Configuration;
using SchoolAdmission.Api.Data;

var builder = WebApplication.CreateBuilder(args);

// ---------------------------------------------------------------------------
// Configuration — everything environment-driven, nothing baked into the image.
// ---------------------------------------------------------------------------
builder.Configuration.AddEnvironmentVariables();

var appOptions = new AppOptions();
builder.Configuration.GetSection(AppOptions.SectionName).Bind(appOptions);

// Accept both HOLD_DURATION_SECONDS (documented contract) and App:HoldDurationSeconds.
var holdSecondsFromEnv = builder.Configuration["HOLD_DURATION_SECONDS"];
if (int.TryParse(holdSecondsFromEnv, out var parsedHoldSeconds) && parsedHoldSeconds > 0)
{
    appOptions.HoldDurationSeconds = parsedHoldSeconds;
}

var sweepSecondsFromEnv = builder.Configuration["EXPIRY_SWEEP_SECONDS"];
if (int.TryParse(sweepSecondsFromEnv, out var parsedSweepSeconds) && parsedSweepSeconds > 0)
{
    appOptions.ExpirySweepSeconds = parsedSweepSeconds;
}

var corsFromEnv = builder.Configuration["CORS_ORIGINS"];
if (!string.IsNullOrWhiteSpace(corsFromEnv))
{
    appOptions.CorsOrigins = corsFromEnv
        .Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);
}

builder.Services.AddSingleton(appOptions);

var connectionString = builder.Configuration.GetConnectionString("Default")
    ?? builder.Configuration["ConnectionStrings__Default"]
    ?? "Host=localhost;Port=5432;Database=school_admission;Username=postgres;Password=postgres";

builder.Services.AddDbContext<AppDbContext>(options => options.UseNpgsql(connectionString));

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
builder.Services.AddProblemDetails();

builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy.WithOrigins(appOptions.CorsOrigins)
            .AllowAnyHeader()
            .AllowAnyMethod()
            .WithExposedHeaders("Location");
    });
});

var app = builder.Build();

// ---------------------------------------------------------------------------
// Pipeline
// ---------------------------------------------------------------------------
app.UseExceptionHandler();
app.UseStatusCodePages();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors();
app.MapControllers();

app.MapGet("/health", () => Results.Ok(new
{
    status = "ok",
    holdDurationSeconds = appOptions.HoldDurationSeconds,
    timestamp = DateTimeOffset.UtcNow
}));

app.Run();

/// <summary>Exposed so integration tests can use WebApplicationFactory.</summary>
public partial class Program;
