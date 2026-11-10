import { chromium } from "playwright";

const base = "http://localhost:5173/";
const api = "http://localhost:8080";

// A different student takes a seat through the API while the browser is open.
const otherStudent = "20152691999999999";

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
await page.goto(base, { waitUntil: "networkidle" });
await page.evaluate(() => localStorage.setItem("getseatly:studentId", "20152691234567890"));
await page.reload({ waitUntil: "networkidle" });
await page.waitForTimeout(2000);

// Pick the Class 7 card and read its available figure.
const card = page.locator("article", { hasText: "Class 7 - Morning shift" }).first();
const readAvailable = async () => {
  const text = await card.locator(".text-figure").first().textContent();
  return text?.trim();
};

const before = await readAvailable();

// Change the data on the server, out of band.
const classes = await (await fetch(`${api}/classes`)).json();
const target = classes.find((c) => c.name === "Class 7 - Morning shift");
const holdRes = await fetch(`${api}/classes/${target.id}/holds`, {
  method: "POST",
  headers: { "X-Student-Id": otherStudent },
});
const created = await holdRes.json();

// Wait for the poll to pick it up — no reload.
await page.waitForTimeout(6500);
const after = await readAvailable();

console.log(
  JSON.stringify(
    {
      before,
      after,
      changed: before !== after,
      holdCreated: holdRes.status,
      holdId: created.holdId,
    },
    null,
    2,
  ),
);

// Clean up so repeat runs start from the same place.
if (created.holdId) {
  await fetch(`${api}/holds/${created.holdId}`, {
    method: "DELETE",
    headers: { "X-Student-Id": otherStudent },
  });
}

await browser.close();
