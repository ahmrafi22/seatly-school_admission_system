# GetSeatly: School Admission System

<img src="https://go-skill-icons.vercel.app/api/icons?i=cs,dotnet,postgres,react,typescript,vite,tailwindcss,docker,nginx,postman" />

A first-come-first-served school admission system with temporary seat holds. A
student applies, a seat is held for ten minutes by default, and the seat is
confirmed when the admission fee is paid. If the timer runs out the seat returns
to the pool on its own.

- **Backend:** C# / .NET 9, ASP.NET Core, EF Core, PostgreSQL 16
- **Frontend:** React 19, TypeScript, Vite, Tailwind CSS v4
- **Runtime:** Docker and Docker Compose

## Where to open it

A hosted copy is running, so the app can be tried without building anything.
The same app runs locally with Docker Compose, which is the path the tests and
the walkthrough below assume.

| | Hosted | Local |
|---|---|---|
| Frontend | [seatly-onno.vercel.app](https://seatly-onno.vercel.app) | [localhost:3000](http://localhost:3000) |
| Backend | [onnoschl.duckdns.org](https://onnoschl.duckdns.org) | [localhost:8080](http://localhost:8080) |
| Health | [onnoschl.duckdns.org/health](https://onnoschl.duckdns.org/health) | [localhost:8080/health](http://localhost:8080/health) |

The hosted frontend is built with `VITE_API_BASE_URL` pointing at the hosted
backend, and that origin is listed in the backend's `CORS_ORIGINS`. Both are
build or boot time values, so the hosted copy is configured rather than
hardcoded.

## Docs

- [ASSUMPTIONS.md](ASSUMPTIONS.md), what was assumed where the brief was silent,
  including how two backend processes on one database are kept from overselling
- [AI_USAGE.md](AI_USAGE.md), which AI models were used, where they went wrong,
  and how each mistake was caught

## Run it

```bash
docker compose up
```

Nothing to install except Docker. On a fresh clone this builds both images,
starts PostgreSQL, the API and the frontend, and waits for each to be healthy.

`docker compose up` logs to the terminal; `docker compose ps` shows when all
three are healthy, which is when the frontend answers. The first start takes a
few minutes because both images are built.

Open the frontend, enter any 17-digit number as a registration number, and you
are in. There is no login: the number is the identity, and it is remembered in
the browser, so a refresh or a browser restart shows the same applications.

The first start has no classes. Add one from **Manage classes**, then apply for
a seat from **Classes**.

Data lives in a named volume and survives `docker compose down`; only
`docker compose down -v` discards it.

## Test

Backend, 20 tests including five against a real PostgreSQL:

```bash
export TEST_DATABASE_CONNECTION="Host=localhost;Port=5432;Database=school_admission_test;Username=postgres;Password=postgres"
dotnet test SchoolAdmission.sln
```

Frontend, 48 tests:

```bash
cd frontend
npm test
```

The five database tests need that connection string; without it they skip, so a
plain `dotnet test` on a machine with no Postgres still passes. They cover the
seat invariant under parallel load, two independent service instances on one
database, repeated confirms, duplicate applications and expiry with no sweeper.

## API

All JSON. `X-Student-Id` is the student's 17-digit birth registration number and
is required where marked.

| # | Method | Path | `X-Student-Id` | Success |
|---|---|---|---|---|
| 1 | POST | `/classes` | | 201 |
| 2 | GET | `/classes` | | 200 |
| 3 | GET | `/classes/{classId}` | | 200 |
| 4 | POST | `/classes/{classId}/holds` | required | 201 |
| 5 | GET | `/holds/{holdId}` | | 200 |
| 6 | POST | `/holds/{holdId}/confirm` | required | 200 |
| 7 | DELETE | `/holds/{holdId}` | required | 204 |
| 8 | GET | `/me/holds` | required | 200 |

A hold is `HELD`, `CONFIRMED`, `EXPIRED` or `CANCELLED`. Applying to a full
class, applying twice to the same class, or confirming an expired hold returns
409. Errors are RFC 7807 Problem Details, so every failure carries a readable
title and detail. A Postman collection covering all eight endpoints is in
`postman/SchoolAdmission.postman_collection.json`.

## Configuration

Environment-driven, nothing baked into an image:

| Variable | Default | Applies to |
|---|---|---|
| `ConnectionStrings__Default` | `Host=localhost;Port=5432;Database=school_admission;Username=postgres;Password=postgres` | backend |
| `HOLD_DURATION_SECONDS` | `600` | backend |
| `CORS_ORIGINS` | `http://localhost:5173,http://localhost:3000` | backend |
| `ASPNETCORE_URLS` | `http://+:8080` | backend |
| `VITE_API_BASE_URL` | `/api` | frontend, at build time |

`VITE_API_BASE_URL` is a build-time constant in Vite. The default `/api` is
proxied by nginx to the backend, so the browser only ever talks to one origin
and CORS never applies. The schema is applied by EF Core migrations on startup.
