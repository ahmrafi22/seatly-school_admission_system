import { chromium } from "playwright";

/**
 * Proves the requirement that a hold flips to EXPIRED on its own, with no
 * reload and no API call.
 *
 * The API is intercepted so the hold is handed to the page already expiring in
 * six seconds. Everything after that is the real application: the countdown,
 * the status chip and the disabled pay button all come from the component's own
 * clock, not from a stubbed response arriving late.
 */
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });

await page.goto("http://localhost:5173/", { waitUntil: "networkidle" });
await page.evaluate(() => localStorage.setItem("getseatly:studentId", "20152691234567890"));

const expiresAt = new Date(Date.now() + 6000).toISOString();

await page.route("**/api/me/holds", (route) =>
  route.fulfill({
    status: 200,
    contentType: "application/json",
    body: JSON.stringify([
      {
        holdId: "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee",
        classId: "11111111-2222-3333-4444-555555555555",
        className: "Expiry Test Class",
        status: "HELD",
        expiresAt,
      },
    ]),
  }),
);

await page.reload({ waitUntil: "networkidle" });
await page.click('nav[aria-label="Sections"] >> text=My applications');
await page.waitForTimeout(1200);

const statusBefore = await page.locator("article").first().textContent();
const payVisibleBefore = await page.locator('button:has-text("Pay admission fee")').isVisible();

// Wait past the expiry instant. No reload, no refresh, no new request needed.
await page.waitForTimeout(8000);

const statusAfter = await page.locator("article").first().textContent();
const payVisibleAfter = await page
  .locator('button:has-text("Pay admission fee")')
  .isVisible()
  .catch(() => false);

await page.screenshot({ path: "shots/11-expired-live.png" });

console.log(
  JSON.stringify(
    {
      beforeHadHeld: /Seat held/.test(statusBefore ?? ""),
      beforeHadPayButton: payVisibleBefore,
      afterHasExpired: /Expired/.test(statusAfter ?? ""),
      afterHadHeld: /Seat held/.test(statusAfter ?? ""),
      payButtonGoneAfterExpiry: !payVisibleAfter,
      expiredBodyShown: /went back to the pool/.test(statusAfter ?? ""),
    },
    null,
    2,
  ),
);

await browser.close();
