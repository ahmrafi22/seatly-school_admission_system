# School Admission System

Backend API for a first-come-first-served school admission system.

- **Backend:** C# / .NET 9, ASP.NET Core, PostgreSQL 16, EF Core
- **Frontend:** React 18 + Vite (not started)
- **Runtime:** Docker + Docker Compose (not started)

## Run locally

Start a database:

```bash
docker run -d --name pg-dev -p 5432:5432 \
  -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=school_admission postgres:16
```

Then run the API:

```bash
cd backend/src/SchoolAdmission.Api
dotnet run
```

API listens on `http://localhost:8080`. Health check: `GET /health`.

Pending migrations are applied automatically on startup, so there is no
separate migration step. Startup retries while Postgres is still warming up.

## Test

```bash
dotnet test SchoolAdmission.sln
```

## Configuration

Environment variables:

| Variable | Default |
|---|---|
| `ConnectionStrings__Default` | `Host=localhost;Port=5432;Database=school_admission;Username=postgres;Password=postgres` |
| `HOLD_DURATION_SECONDS` | `600` |
| `EXPIRY_SWEEP_SECONDS` | `15` |
| `CORS_ORIGINS` | `http://localhost:5173,http://localhost:3000` |
| `ASPNETCORE_URLS` | `http://+:8080` |

See `.env.example`.

## Database

Schema is managed by EF Core migrations in
`backend/src/SchoolAdmission.Api/Migrations`.

```bash
# add a migration
dotnet ef migrations add <Name> --project backend/src/SchoolAdmission.Api

# apply manually (normally automatic on startup)
dotnet ef database update --project backend/src/SchoolAdmission.Api
```

Two constraints enforce the seat rules at the database level, so they hold even
across multiple API processes sharing one database:

- `ck_classes_seat_inventory` — rejects any row where
  `HeldCount + ConfirmedCount > TotalSeats`.
- `ux_holds_active_per_student_class` — partial unique index on
  `(ClassId, StudentId)` restricted to `HELD`/`CONFIRMED`, so a student cannot
  hold two active applications in the same class.

## Structure

```
backend/
  src/SchoolAdmission.Api/
  tests/SchoolAdmission.Api.Tests/
```

See `../plan.md` for the build and deployment plan.
