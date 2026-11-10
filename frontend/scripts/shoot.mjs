import { chromium } from "playwright";

const shots = process.argv[2] || "shots";
const base = process.argv[3] || "http://localhost:5173/";

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

const errors = [];
page.on("console", (msg) => {
  if (msg.type() === "error") errors.push(msg.text());
});
page.on("pageerror", (err) => errors.push(`PAGEERROR: ${err.message}`));

await page.goto(base, { waitUntil: "networkidle" });
await page.screenshot({ path: `${shots}/01-gate.png`, fullPage: false });

// Enter the student id
await page.fill('input[name="studentId"]', "20152691234567890");
await page.screenshot({ path: `${shots}/02-gate-filled.png` });

await page.click('button[type="submit"]');
await page.waitForTimeout(2500);
await page.screenshot({ path: `${shots}/03-classes.png`, fullPage: false });

// My applications
await page.click('nav[aria-label="Sections"] >> text=My applications');
await page.waitForTimeout(1200);
await page.screenshot({ path: `${shots}/04-mine.png`, fullPage: false });

// Manage
await page.click('nav[aria-label="Sections"] >> text=Manage classes');
await page.waitForTimeout(1500);
await page.screenshot({ path: `${shots}/05-manage.png`, fullPage: false });

// Back to classes, apply for one
await page.click('nav[aria-label="Sections"] >> text=Classes');
await page.waitForTimeout(1200);
const applyButtons = page.locator('button:has-text("Apply for a seat")');
const count = await applyButtons.count();
if (count > 0) {
  await applyButtons.first().click();
  await page.waitForTimeout(2500);
  await page.screenshot({ path: `${shots}/06-after-apply.png`, fullPage: false });
}

// Dark mode
await page.click('button[aria-label="Dark"]');
await page.waitForTimeout(1400);
await page.screenshot({ path: `${shots}/07-dark.png`, fullPage: false });

// Bangla
await page.click('button:has-text("বাংলা")');
await page.waitForTimeout(1200);
await page.screenshot({ path: `${shots}/08-bangla-dark.png`, fullPage: false });

// Mobile
await page.setViewportSize({ width: 390, height: 844 });
await page.waitForTimeout(900);
await page.screenshot({ path: `${shots}/09-mobile.png`, fullPage: false });

// Overflow probe
const metrics = await page.evaluate(() => ({
  scrollWidth: document.documentElement.scrollWidth,
  clientWidth: document.documentElement.clientWidth,
}));

console.log(JSON.stringify({ errors, metrics, applyCount: count }, null, 2));

await browser.close();
