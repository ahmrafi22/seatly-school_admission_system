import { chromium } from "playwright";

/**
 * Full journey through the containerised stack: create a class from the admin
 * screen, apply as a student, confirm the admission, and check the seat
 * arithmetic lands where it should. Runs against nginx on :3000, so the /api
 * proxy and the built bundle are both exercised.
 */
const base = "http://localhost:3000/";
const studentId = "20152691234567890";

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
page.on("console", (m) => {
  if (m.type() === "error") errors.push(m.text());
});

const steps = {};

await page.goto(base, { waitUntil: "networkidle" });
await page.evaluate((id) => localStorage.setItem("getseatly:studentId", id), studentId);
await page.reload({ waitUntil: "networkidle" });
await page.waitForTimeout(1200);

// ---- Create a class ---------------------------------------------------------
await page.click('nav[aria-label="Sections"] >> text=Manage classes');
await page.waitForTimeout(800);
await page.fill('input[type="text"]', "Class 9 - Science");
// React Aria's number field is a text input with `inputmode="numeric"`.
const seatField = page.locator('input[inputmode="numeric"]');
await seatField.fill("3");
await page.click('button:has-text("Create class")');
await page.waitForTimeout(2000);
steps.classCreated = (await page.locator("body").textContent()).includes("Class 9 - Science");

// ---- Apply ------------------------------------------------------------------
await page.click('nav[aria-label="Sections"] >> text=Classes');
await page.waitForTimeout(2000);
await page.locator('button:has-text("Apply for a seat")').first().click();
await page.waitForTimeout(2500);
steps.applied = (await page.locator("body").textContent()).includes("Seat held");

// ---- Confirm ----------------------------------------------------------------
await page.locator('button:has-text("Pay admission fee")').first().click();
await page.waitForTimeout(900);
await page.click('button:has-text("Confirm admission")');
await page.waitForTimeout(2500);
const bodyAfter = await page.locator("body").textContent();
steps.confirmed = /Confirmed/.test(bodyAfter ?? "");
steps.confirmBodyShown = /seat is secured/.test(bodyAfter ?? "");
steps.payButtonGone = (await page.locator('button:has-text("Pay admission fee")').count()) === 0;

await page.screenshot({ path: "shots/12-compose-confirmed.png" });

// ---- The seat count reflects the confirmed admission -----------------------
const classes = await (await fetch("http://localhost:3000/api/classes")).json();
steps.serverState = classes.map((c) => ({
  name: c.name,
  total: c.totalSeats,
  held: c.heldSeats,
  confirmed: c.confirmedSeats,
  available: c.availableSeats,
}));

console.log(JSON.stringify({ steps, errors }, null, 2));
await browser.close();
