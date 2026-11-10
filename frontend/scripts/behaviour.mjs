import { chromium } from "playwright";

const base = "http://localhost:5173/";
const studentId = "20152691234567890";

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));

// Reach the app and a class list.
await page.goto(base, { waitUntil: "networkidle" });
await page.evaluate((id) => localStorage.setItem("getseatly:studentId", id), studentId);
await page.reload({ waitUntil: "networkidle" });
await page.waitForTimeout(1500);

const report = {};

// ---- 1. Apply for a seat, then watch the countdown decrement -----------------
const applyBtn = page.locator('button:has-text("Apply for a seat")').first();
await applyBtn.click();
await page.waitForTimeout(2200);

const countdownBefore = await page.locator("text=/Expires in/").first().textContent().catch(() => null);
await page.waitForTimeout(3000);
const countdownAfter = await page.locator("text=/Expires in/").first().textContent().catch(() => null);
report.countdown = { before: countdownBefore, after: countdownAfter, ticking: countdownBefore !== countdownAfter };

// ---- 2. The freshness label is present and readable ------------------------
// (Whether the counts actually move is covered by scripts/polling.mjs, which
// changes the data out of band. Comparing two snapshots of an idle database
// here would prove nothing.)
report.freshnessVisible = await page.locator("text=/Updated/").first().isVisible().catch(() => false);

// ---- 3. The 17-digit id survives a reload -----------------------------------
const stored = await page.evaluate(() => localStorage.getItem("getseatly:studentId"));
report.idPersisted = stored === studentId;

// ---- 4. Language toggle persists --------------------------------------------
await page.click('button:has-text("বাংলা")');
await page.waitForTimeout(600);
const banglaHeading = await page.locator("h2").first().textContent();
report.banglaHeading = banglaHeading?.trim();
await page.reload({ waitUntil: "networkidle" });
await page.waitForTimeout(1000);
report.banglaPersists = (await page.locator("h2").first().textContent())?.includes("ক্লাস");
await page.click('button:has-text("EN")');
await page.waitForTimeout(600);

// ---- 5. Dark mode persists --------------------------------------------------
await page.click('button[aria-label="Dark"]');
await page.waitForTimeout(900);
const isDark = await page.evaluate(() => document.documentElement.classList.contains("dark"));
await page.reload({ waitUntil: "networkidle" });
await page.waitForTimeout(800);
report.darkPersists =
  isDark && (await page.evaluate(() => document.documentElement.classList.contains("dark")));
await page.click('button[aria-label="Light"]');
await page.waitForTimeout(600);

// ---- 6. Server down ---------------------------------------------------------
// Block the API at the network layer; this is the same failure a stopped
// backend produces, without having to kill the process under the test.
await page.route("**/api/**", (route) => route.abort("connectionrefused"));
await page.reload({ waitUntil: "domcontentloaded" });
await page.waitForTimeout(9000);
const bodyText = await page.locator("body").textContent();
report.serverDownShowsMessage = /reach the server|not answering|Server unreachable/i.test(
  bodyText ?? "",
);
await page.screenshot({ path: "shots/10-server-down.png" });
report.consoleErrors = errors;

console.log(JSON.stringify(report, null, 2));
await browser.close();
