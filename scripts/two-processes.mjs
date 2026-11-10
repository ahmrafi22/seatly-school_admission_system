/**
 * Two real OS processes, one database.
 *
 * This is the scenario the concurrency unit test approximates with two
 * DbContexts inside one process. Here it is literal: the same published API is
 * started twice on different ports, both pointed at the same database, and 60
 * applicants race for 10 seats across both.
 *
 * The binary is published once and launched twice, because two `dotnet run`
 * invocations in one directory contend over the same build output.
 *
 * Run with: node scripts/two-processes.mjs
 */
import { spawn } from "node:child_process";
import { setTimeout as sleep } from "node:timers/promises";
import { existsSync } from "node:fs";

const PUBLISH_DIR =
  process.env.API_PUBLISH_DIR ??
  "C:\\Users\\ahmra\\AppData\\Local\\Temp\\opencode\\api-publish";

const CONN =
  process.env.TEST_CONNECTION ??
  "Host=localhost;Port=5432;Database=school_admission;Username=postgres;Password=postgres";

if (!existsSync(`${PUBLISH_DIR}/SchoolAdmission.Api.dll`)) {
  console.error(
    `Published API not found at ${PUBLISH_DIR}.\n` +
      "Publish it first: dotnet publish -c Release -o <dir>",
  );
  process.exit(1);
}

const procs = [];

function startApi(port) {
  const child = spawn("dotnet", ["SchoolAdmission.Api.dll"], {
    cwd: PUBLISH_DIR,
    env: {
      ...process.env,
      ASPNETCORE_URLS: `http://localhost:${port}`,
      ConnectionStrings__Default: CONN,
      HOLD_DURATION_SECONDS: "600",
    },
    stdio: "ignore",
  });
  procs.push(child);
  return child;
}

async function waitFor(port, timeoutMs = 90_000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const res = await fetch(`http://localhost:${port}/health`);
      if (res.ok) return true;
    } catch {
      /* not up yet */
    }
    await sleep(500);
  }
  return false;
}

const studentId = (n) => String(20152691230000000 + n).padStart(17, "0");

try {
  startApi(8091);
  startApi(8092);

  const [okA, okB] = await Promise.all([waitFor(8091), waitFor(8092)]);
  if (!okA || !okB) {
    throw new Error(`instances did not start (8091=${okA}, 8092=${okB})`);
  }

  const created = await (
    await fetch("http://localhost:8091/classes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: `Two-process race ${Date.now()}`, totalSeats: 10 }),
    })
  ).json();

  // 60 applicants, alternating between the two processes.
  const attempts = await Promise.all(
    Array.from({ length: 60 }, (_, i) =>
      fetch(`http://localhost:${i % 2 === 0 ? 8091 : 8092}/classes/${created.id}/holds`, {
        method: "POST",
        headers: { "X-Student-Id": studentId(i) },
      }).then((res) => res.status),
    ),
  );

  const accepted = attempts.filter((s) => s === 201).length;
  const conflicts = attempts.filter((s) => s === 409).length;
  const other = attempts.filter((s) => s !== 201 && s !== 409);

  const finalState = await (
    await fetch(`http://localhost:8091/classes/${created.id}`)
  ).json();

  const result = {
    totalSeats: finalState.totalSeats,
    heldSeats: finalState.heldSeats,
    confirmedSeats: finalState.confirmedSeats,
    availableSeats: finalState.availableSeats,
    accepted,
    conflicts,
    unexpectedStatuses: other,
    oversold: finalState.heldSeats + finalState.confirmedSeats > finalState.totalSeats,
    exact: accepted === 10 && finalState.availableSeats === 0,
  };

  console.log(JSON.stringify(result, null, 2));
  process.exitCode = result.exact && !result.oversold ? 0 : 1;
} finally {
  for (const proc of procs) {
    proc.kill();
  }
}
