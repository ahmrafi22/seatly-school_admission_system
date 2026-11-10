import { chromium } from "playwright";

/**
 * Proves seat counts move without a reload.
 *
 * The app is opened and left completely alone; the change is made out of band
 * through the API by a second student. If the number on screen moves, it moved
 * because the page polled — there is no other mechanism.
 *
 * A class is created for each run so the test does not depend on whatever
 * happens to be in the database.
 */
const base = "http://localhost:5173/";
const api = "http://localhost:8080";
const studentId = "20152691234567890";
const otherStudent = "20152691999999999";

// ---- Arrange -----------------------------------------------------------------
const created = await (
  await fetch(`${api}/classes`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: `Polling probe ${Date.now()}`, totalSeats: 12 }),
  })
).json();

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
await page.goto(base, { waitUntil: "networkidle" });
await page.evaluate((id) => localStorage.setItem("getseatly:studentId", id), studentId);
await page.reload({ waitUntil: "networkidle" });
await page.waitForTimeout(2000);

const card = page.locator("article", { hasText: created.name }).first();
const readAvailable = async () =>
  (await card.locator(".text-figure").first().textContent())?.trim();

const before = await readAvailable();

// ---- Act: a different student takes a seat, out of band ----------------------
const holdRes = await fetch(`${api}/classes/${created.id}/holds`, {
  method: "POST",
  headers: { "X-Student-Id": otherStudent },
});
const hold = await holdRes.json();

// ---- Assert: the open page notices on its own --------------------------------
await page.waitForTimeout(6500);
const after = await readAvailable();

console.log(
  JSON.stringify(
    {
      before,
      after,
      changedWithoutReload: before !== after,
      holdStatus: holdRes.status,
    },
    null,
    2,
  ),
);

// ---- Clean up ---------------------------------------------------------------
if (hold.holdId) {
  await fetch(`${api}/holds/${hold.holdId}`, {
    method: "DELETE",
    headers: { "X-Student-Id": otherStudent },
  });
}

await browser.close();
process.exitCode = before !== after ? 0 : 1;
