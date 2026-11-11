# Assumptions

## Payment

Paying the fee is assumed to succeed, as the brief instructs. No gateway, no
payment record, no fee amount anywhere in the schema. Confirm is the single point
where a held seat becomes permanent; a real gateway would slot in ahead of that
one call.

## Expiry

A hold occupies a seat only while it is `HELD` and not past `ExpiresAt`. Lapsed
holds are reclaimed inside the write transaction, after the row lock and before
capacity is checked, so a seat freed by expiry is available to the very next
applicant. There is no background sweeper: the brief requires seats to return on
their own with no API call, and the write path already has the transaction and the
lock needed to do it atomically.

A lapsed hold that no request has touched yet still reads `HELD` in storage, but
every seat calculation treats it as expired, so the reported numbers are exact.
The frontend flips its own card to expired the instant its timer ends, then lets
the next poll confirm it with the server.

## One active application per student per class

Application code alone cannot enforce this under concurrency, so a partial unique
index on `(ClassId, StudentId)` where status is `HELD` or `CONFIRMED` makes the
database the arbiter. A `CANCELLED` or `EXPIRED` row drops out of the index and the
student can apply again.

## Confirmation is idempotent

Confirm only updates a row that is still `HELD` and unexpired, so a repeated
confirm cannot count a seat twice.

## Classes are create-only

The contract defines eight endpoints and none of them edit or delete a class, so
no such surface exists. Names are not unique; the GUID id is the identifier, since
the brief leaves the id format open. Creation validates the name (1 to 200
characters) and the seat count (1 to 10,000), and neither changes afterwards,
which keeps the inventory columns a ledger.

## Interface language

English and Bangla, switchable in the header, remembered in the browser. The
product is a Bangladeshi school admission system and the brief itself is written
in Bengali, so a parent applying for a seat is the primary user. Bangla is written
as Bangla, not transliterated.

## Time and configuration

Timestamps are stored and returned in UTC, so expiry never depends on a server
timezone; clients render local time. Everything environment-specific is an
environment variable: connection string, hold duration, CORS origins, frontend
API base URL. The same images run locally, under compose, and on a VPS.

## Live counts

The brief wants seat numbers refreshing every few seconds without a reload. The UI
polls classes every 4 seconds and holds every 5, pauses while the tab is hidden,
and reads again on focus. Polling rather than WebSockets, because the requirement
is behavioural and a socket would be a second source of truth for the same
numbers.

## Two backend processes on one database

The brief's mandatory rule is `held + confirmed <= totalSeats` under any load,
including two backend processes sharing one database. Three layers enforce it:

1. Every write opens a transaction and takes the class row first with
   `SELECT 1 FROM classes WHERE "Id" = @p0 FOR UPDATE`. PostgreSQL serialises
   writers on that row, so read, check and write are atomic across threads and
   across processes. An in-process `lock` would cover threads only, which is why
   the serialisation point is the database.
2. A `CHECK` constraint, `ck_classes_seat_inventory`, rejects any row where
   `HeldCount + ConfirmedCount > TotalSeats`, so a logic bug fails loudly instead
   of overselling.
3. The partial unique index above stops one student from holding two active
   applications in the same class.

The committed test is
`ConcurrencyTests.TwoProcessesSharingOneDatabase_StillNeverOversell`: two
independent service instances, each with its own database contexts, against one
database, 40 applicants racing for 5 seats. Exactly 5 succeed and the counters
agree afterwards. It is one OS process, so what it proves is that the lock is in
the database rather than in memory, which is the part that matters.

The literal case was also run against the composed stack: two backend containers
on the same network and database, ports 8099 and 8098, 60 distinct applicants
alternating between them against a 10-seat class. Result: 10 accepted, 50
rejected with 409, `heldSeats` 10, `availableSeats` 0. That run is manual and not
part of the suite, because it needs a second container and two free ports.
