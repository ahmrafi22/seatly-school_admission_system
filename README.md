# GetSeatly — School Admission System

A first-come-first-served school admission system with temporary seat holds.
A student applies, a seat is held for ten minutes, and the seat is confirmed
when the admission fee is paid. If the timer runs out the seat returns to the
pool on its own.

- **Backend:** C# / .NET 9, ASP.NET Core, EF Core, PostgreSQL 16
- **Frontend:** React 19, TypeScript, Vite, Tailwind CSS v4
- **Runtime:** Docker and Docker Compose

## Run it

Everything runs from one command. Nothing needs to be installed except Docker.

```bash
docker compose up
```

On a fresh clone this builds both images itself, starts PostgreSQL, the API
and the frontend, waits for each to be healthy, and then prints where to go:

```text
  Ready. Open:

    Frontend :  http://localhost:3000
    Backend  :  http://localhost:8080
    Health   :  http://localhost:8080/health
```

| | |
|---|---|
| **Frontend** | **http://localhost:3000** |
| Backend API | http://localhost:8080 |
| PostgreSQL | `localhost:5432` (`postgres` / `postgres`) |

The terminal stays attached and shows the logs; **Ctrl+C stops the stack**
(the data survives in its volume — only `docker compose down -v` discards it).
Prefer the background? `docker compose up -d` starts the same stack silently —
detached mode prints no container output, so the table above is the address
book. Add `--build` to force a rebuild after pulling new code.

Open the frontend, enter any 17-digit number as a registration number, and you
are in. There is no login: the number is the identity, and it is remembered in
the browser so a refresh or a browser restart shows the same applications.

The first start has no classes. Add one from **Manage classes**, then apply for
a seat from **Classes**.

Stop with `docker compose down`. Data is kept in a named volume and survives
stop/start; `docker compose down -v` is the only thing that discards it.

## Test

Backend — 20 tests, including five that run against a real PostgreSQL:

```bash
export TEST_DATABASE_CONNECTION="Host=localhost;Port=5432;Database=school_admission_test;Username=postgres;Password=postgres"
dotnet test SchoolAdmission.sln
```

Frontend — 48 tests:

```bash
cd frontend
npm test
```

The concurrency suite needs the database above. It creates and drops its own
rows and does not touch the application database. One of the five is the
literal two-process test: two backend OS processes sharing one database, sixty
concurrent applicants, exactly ten accepted and fifty rejected with 409.

## How the seat rules are enforced

The invariant is `held + confirmed <= totalSeats`, and it has to hold under
concurrency, including two API processes on one database. Three independent
layers, described in full in `ASSUMPTIONS.md`:

1. **Row lock.** Every write opens a transaction and takes
   `SELECT 1 FROM classes WHERE "Id" = @p0 FOR UPDATE`. PostgreSQL serialises
   writers on that row, so read → check → write is atomic across threads *and*
   processes. An in-process `lock` would fail the second case, which is why the
   serialisation point is the database.
2. **`CHECK` constraint** — `ck_classes_seat_inventory` rejects any row where
   `HeldCount + ConfirmedCount > TotalSeats`. A logic bug fails loudly instead
   of overselling.
3. **Partial unique index** — `ux_holds_active_per_student_class` on
   `(ClassId, StudentId)` where the status is `HELD` or `CONFIRMED`, so one
   student cannot hold two active applications in the same class.

Expiry needs no background job and no API call. Lapsed holds are reclaimed
lazily inside the write transaction, after the row lock and before capacity is
checked, so a seat freed by expiry is immediately available to the next
applicant.

## Configuration

Everything is environment-driven; nothing environment-specific is baked into an
image.

| Variable | Default | Applies to |
|---|---|---|
| `ConnectionStrings__Default` | `Host=localhost;Port=5432;Database=school_admission;Username=postgres;Password=postgres` | backend |
| `HOLD_DURATION_SECONDS` | `600` | backend |
| `CORS_ORIGINS` | `http://localhost:5173,http://localhost:3000` | backend |
| `ASPNETCORE_URLS` | `http://+:8080` | backend |
| `VITE_API_BASE_URL` | `/api` | frontend, at build time |

`VITE_API_BASE_URL` is a build-time constant in Vite. The default `/api` is
proxied by nginx to the backend, so the browser only ever talks to one origin
and CORS never applies. Pointing the frontend at a different API host means
rebuilding it with `--build-arg VITE_API_BASE_URL=https://api.example.com`.

## Structure

```
backend/
  Dockerfile
  src/SchoolAdmission.Api/
    Controllers/        Classes, Holds, Me
    Services/           SeatAllocationService — all seat accounting
    Domain/Entities/    Class, Hold, HoldStatus
    Data/               AppDbContext — constraints and indexes
    Migrations/
  tests/SchoolAdmission.Api.Tests/
frontend/
  Dockerfile
  nginx.conf            static host + /api proxy
  components/           BoardUI component source
  styles/               design tokens
  src/
    views/              Classes, MyApplications, Manage
    components/         identity gate, class card, seat bar, freshness
    lib/                api client, polling, formatting
    i18n/               English and Bangla copy
docker-compose.yml
scripts/two-processes.mjs
```

## API

All JSON. `X-Student-Id` (exactly 17 digits) is required where marked.

| # | Method | Path | Header | Success |
|---|---|---|---|---|
| 1 | POST | `/classes` | — | 201 + `Location` |
| 2 | GET | `/classes` | — | 200 |
| 3 | GET | `/classes/{classId}` | — | 200 |
| 4 | POST | `/classes/{classId}/holds` | ✓ | 201 |
| 5 | GET | `/holds/{holdId}` | — | 200 |
| 6 | POST | `/holds/{holdId}/confirm` | ✓ | 200 |
| 7 | DELETE | `/holds/{holdId}` | ✓ | 204 |
| 8 | GET | `/me/holds` | ✓ | 200 |

`GET /health` exists outside the contract. Errors are RFC 7807 Problem Details,
so every failure carries a human-readable `title` and `detail`.

A Postman collection covering all eight endpoints is in
`postman/SchoolAdmission.postman_collection.json`, for direct API testing during
development. The UI covers the same ground and is the intended way to use the
system.

## Database

Schema is managed by EF Core migrations and applied automatically on startup,
so `docker compose up` needs no separate step. Startup retries up to ten times
while PostgreSQL warms up.

```bash
# add a migration
dotnet ef migrations add <Name> --project backend/src/SchoolAdmission.Api

# apply manually (normally automatic)
dotnet ef database update --project backend/src/SchoolAdmission.Api
```

## Deployment

The backend runs on a Linux VPS and the frontend on Vercel; both are configured
entirely through environment variables and settings, with no code changes.

- **VPS:** run `backend/Dockerfile` with `ConnectionStrings__Default`,
  `HOLD_DURATION_SECONDS` and `CORS_ORIGINS` set, and terminate TLS in front of
  port 8080.
- **Vercel:** build the `frontend/` directory with `VITE_API_BASE_URL` pointing
  at the API's public URL, and add that frontend URL to `CORS_ORIGINS`.
