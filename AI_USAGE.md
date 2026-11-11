# AI usage

Code was written with AI assistants, file by file, against a written spec.

The spec came first. The eight endpoints, the schema, the seat invariant, the
status codes and the UI screens were written down before any code. Generation then
went one file type at a time, in dependency order: entities and migration, seat
service, controllers, backend tests, then the frontend API client, polling hook
and views, then Docker and nginx last. Every file was checked before it was
kept, and anything that did not match the spec was rewritten.

## Tools

Written through the OpenCode CLI, with three models sharing the work.

| Model | Used for |
|---|---|
| DeepSeek v4.1 Flash | Domain model, seat allocation service, endpoints, PostgreSQL-backed tests, Docker setup |
| GLM 5.3 Flash | React app, component kit, styles, frontend tests |
| GPT 6 Luna | Spec and contract review, doc drafts |

## Where AI got it wrong

Five real failures. Each one says what the agent did wrong and how I fixed it.

### 1. Seat allocation could oversell

- **What the agent did wrong:** the lock mixed `FromSqlRaw` with an entity reload
  that ran after the lock, and one method held dead placeholder code.
- **How I fixed it:** rewrote the service around an explicit
  `SELECT ... FOR UPDATE`. Reading the file before building is what caught it.

### 2. The "two processes" test used one process

- **What the agent did wrong:** both database contexts ran in a single host
  process, which proves nothing about the database.
- **How I fixed it:** the test now builds two independent services, each with its
  own contexts, on one database, and races 40 applicants for 5 seats. Reading the
  test's own setup is what showed the two "processes" shared one host. I also ran
  the real thing outside the suite: two backend containers on one database, 60
  applicants, 10 seats, 10 accepted and 50 rejected with 409.

### 3. The Dockerfile failed twice

- **What the agent did wrong:** it created an `app` user the base image already
  has, then copied the host's `obj/` into the image and broke restore with a
  misleading error.
- **How I fixed it:** reused the image's own user and added a `.dockerignore`.
  Only `docker compose build` found either fault.

### 4. A validation bug only a test caught

- **What the agent did wrong:** the identity gate truncated a pasted 20-digit
  number on screen but validated the untruncated value, so a number that looked
  right was refused.
- **How I fixed it:** the input normalises before it stores.

### 5. Every number vanished in Bangla

- **What the agent did wrong:** it rendered the figures with `NumberFlow` under a
  Bengali locale, where the component measures its digits at zero width, so seat
  counts, countdowns and the clock disappeared. English was fine, and the build,
  the types and all 48 frontend tests passed.
- **How I fixed it:** a browser screenshot caught it. Bangla now renders the
  localised digits as plain text, and English keeps the rolling animation.

The pattern across all five: no green result was taken on trust. A build passed
over a broken Dockerfile, a test suite passed while testing the wrong thing, and
a page looked fine through a real bug. Each was caught against reality: the
source, `docker compose build`, a failing test, a browser screenshot.

## What was verified directly

- Overselling is impossible at the database level. A row with
  `HeldCount + ConfirmedCount > TotalSeats` is rejected by the CHECK constraint,
  and negative counts too.
- The row lock is what holds it. Removing `FOR UPDATE` oversells (50 holds on 10
  seats); restoring it returns the exact 10/50 split.
- Expiry needs no API call. Forcing `ExpiresAt` into the past frees the seat for
  the next applicant.
- The contract holds. The Postman collection runs 23 requests and 48 assertions
  green against a fresh database.
- The stack survives. End to end through nginx on port 3000, data intact across
  `docker compose down` and `up`.
- The hold duration is the environment variable. Starting the API with
  `HOLD_DURATION_SECONDS=45` reports 45 in `/health` and issues 45-second
  `expiresAt` values.

At submission: 20 backend tests, five of them against a real PostgreSQL, and 48
frontend tests, all passing.
