// Capture README screenshots from a running SupportLoop deployment.
//
//   SCREENSHOT_BASE_URL=https://support.aidancrosbie.com npx tsx scripts/screenshots.ts
//
// Defaults to the live demo. Logs in once with the seeded admin demo account
// (which can view both /ops and /agent) and writes PNGs to docs/screenshots/.
import { chromium, type Page } from "playwright";
import fs from "fs";
import path from "path";
import { DEMO_ACCOUNTS, DEMO_PASSWORD } from "../lib/demo-accounts";

const BASE = process.env.SCREENSHOT_BASE_URL ?? "https://support.aidancrosbie.com";
const OUT = path.join(process.cwd(), "docs", "screenshots");
const admin = DEMO_ACCOUNTS.find((a) => a.role === "admin")!;

interface Shot {
  name: string;
  path: string;
  auth?: boolean;
  prep?: (page: Page) => Promise<void>;
}

const SHOTS: Shot[] = [
  { name: "home", path: "/" },
  { name: "help-center", path: "/help/orbit" },
  { name: "ops-dashboard", path: "/ops", auth: true },
  { name: "ai-activity", path: "/ops/activity", auth: true },
  {
    name: "quality-evals",
    path: "/ops/quality",
    auth: true,
    prep: async (page) => {
      // Run the eval suite so the page shows real grounded-rate results, not the empty state.
      await page.locator("text=Run eval").first().click();
      await page
        .getByText(/no eval run yet/i)
        .waitFor({ state: "hidden", timeout: 120000 })
        .catch(() => {});
      await page.waitForTimeout(2500);
    },
  },
  {
    name: "agent-inbox",
    path: "/agent",
    auth: true,
    prep: async (page) => {
      // The default "My open" tab is empty for the admin; switch to a populated view.
      await page.locator("text=All open").first().click().catch(() => {});
      await page.waitForTimeout(1500);
    },
  },
];

async function login(page: Page) {
  await page.goto(`${BASE}/login`, { waitUntil: "domcontentloaded" });
  await page.fill('input[type="email"]', admin.email);
  await page.fill('input[type="password"]', DEMO_PASSWORD);
  await Promise.all([
    page.waitForURL("**/ops**", { timeout: 45000 }),
    page.click('button[type="submit"]'),
  ]);
}

async function main() {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 });
  const page = await ctx.newPage();
  let loggedIn = false;

  for (const s of SHOTS) {
    try {
      if (s.auth && !loggedIn) {
        await login(page);
        loggedIn = true;
      }
      await page.goto(`${BASE}${s.path}`, { waitUntil: "domcontentloaded" });
      await page.waitForTimeout(2800);
      if (s.prep) await s.prep(page);
      await page.screenshot({ path: path.join(OUT, `${s.name}.png`) });
      console.log("captured", s.name);
    } catch (e) {
      console.error("FAILED", s.name, (e as Error).message);
    }
  }

  await browser.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
