/**
 * CASTD error scanner — visits all key pages and reports:
 *  - Console errors / warnings
 *  - Failed network requests
 *  - React runtime errors (error boundaries)
 *  - Unhandled promise rejections
 */

const { chromium } = require("playwright");

const BASE = "http://localhost:3000";
const API  = "http://localhost:8000";

// Pages to scan — [url, requiresAuth, description]
const PAGES = [
  ["/",                    false, "Landing page"],
  ["/login",               false, "Login page"],
  ["/signup",              false, "Signup page"],
  ["/onboarding",          true,  "Onboarding — role selection"],
  ["/portal",              true,  "Portal router"],
  ["/dashboard",           true,  "Brand dashboard"],
  ["/catalog",             true,  "Brand catalog"],
  ["/shortlist",           true,  "Brand shortlist"],
  ["/inquiries",           true,  "Brand inquiries"],
  ["/campaigns",           true,  "Brand campaigns"],
  ["/settings",            true,  "Brand settings"],
  ["/superstar/dashboard", true,  "Superstar dashboard"],
  ["/superstar/profile",   true,  "Superstar profile"],
  ["/superstar/bookings",  true,  "Superstar bookings"],
  ["/superstar/campaigns", true,  "Superstar campaigns"],
  ["/admin",               true,  "Admin dashboard"],
  ["/admin/talents",       true,  "Admin superstars"],
  ["/admin/brands",        true,  "Admin brands"],
  ["/admin/inquiries",     true,  "Admin inquiries"],
  ["/admin/settings",      true,  "Admin settings"],
];

// Test credentials (must exist in DB)
const TEST_EMAIL    = "test@castd.sg";
const TEST_PASSWORD = "TestPass123!";

async function checkApi() {
  try {
    const res = await fetch(`${API}/health`);
    const json = await res.json();
    return json.status === "ok";
  } catch {
    return false;
  }
}

async function login(page) {
  await page.goto(`${BASE}/login`, { waitUntil: "networkidle" });
  await page.fill('input[type="email"]', TEST_EMAIL);
  await page.fill('input[type="password"]', TEST_PASSWORD);
  await page.click('button[type="submit"]');
  // Wait for redirect away from login
  await page.waitForURL(url => !url.toString().includes("/login"), { timeout: 10000 });
  console.log(`  ✓ Logged in as ${TEST_EMAIL}`);
}

async function scanPage(page, url, description) {
  const errors   = [];
  const warnings = [];
  const failed   = [];

  // Capture console output
  page.on("console", msg => {
    if (msg.type() === "error")   errors.push(msg.text());
    if (msg.type() === "warning") warnings.push(msg.text());
  });

  // Capture unhandled exceptions
  page.on("pageerror", err => errors.push(`[UNCAUGHT] ${err.message}`));

  // Capture failed requests (4xx/5xx or network failures)
  page.on("requestfailed", req => {
    const url = req.url();
    // Ignore Chrome extension noise
    if (!url.startsWith("chrome-extension")) {
      failed.push(`[NET FAIL] ${req.method()} ${url} — ${req.failure()?.errorText}`);
    }
  });

  page.on("response", res => {
    const status = res.status();
    const resUrl = res.url();
    if (status >= 400 && !resUrl.includes("_next") && !resUrl.includes("favicon")) {
      failed.push(`[HTTP ${status}] ${res.request().method()} ${resUrl}`);
    }
  });

  try {
    await page.goto(`${BASE}${url}`, { waitUntil: "domcontentloaded", timeout: 15000 });
    // Let React hydrate and any async data load
    await page.waitForTimeout(2500);
  } catch (e) {
    errors.push(`[NAVIGATION] ${e.message}`);
  }

  return { url, description, errors, warnings, failed };
}

async function main() {
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("  CASTD Error Scanner");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

  // Check API is up
  const apiOk = await checkApi();
  console.log(`API (port 8000):  ${apiOk ? "✓ online" : "✗ OFFLINE — start uvicorn first"}`);
  console.log(`Web (port 3000):  scanning...\n`);

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    ignoreHTTPSErrors: true,
    viewport: { width: 1280, height: 800 },
  });
  const page = await context.newPage();

  // Log in once — session cookie persists across page navigations
  try {
    await login(page);
  } catch (e) {
    console.log(`  ✗ Login failed: ${e.message}`);
    console.log("  Auth-required pages will show redirect errors — that's expected.\n");
  }

  const results = [];

  for (const [url, requiresAuth, description] of PAGES) {
    process.stdout.write(`  Scanning ${url.padEnd(30)}`);
    const result = await scanPage(page, url, description);
    results.push(result);

    const hasIssues = result.errors.length > 0 || result.failed.length > 0;
    console.log(hasIssues ? "✗ ISSUES" : "✓ OK");
  }

  await browser.close();

  // ── Report ──────────────────────────────────────────────
  console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("  RESULTS");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

  const problemPages = results.filter(r => r.errors.length > 0 || r.failed.length > 0);
  const cleanPages   = results.filter(r => r.errors.length === 0 && r.failed.length === 0);

  console.log(`✓ Clean pages: ${cleanPages.length}/${results.length}`);
  if (problemPages.length === 0) {
    console.log("✓ No errors found across all pages!\n");
    return;
  }

  console.log(`✗ Pages with issues: ${problemPages.length}\n`);

  for (const r of problemPages) {
    console.log(`┌─ ${r.description} (${r.url})`);

    for (const e of r.errors) {
      // Truncate very long stack traces
      const short = e.split("\n")[0].slice(0, 200);
      console.log(`│  ✗ ERROR:   ${short}`);
    }
    for (const f of r.failed) {
      // Filter out Next.js internal 404s for hot-reload chunks
      if (f.includes("_next/static")) continue;
      console.log(`│  ✗ NETWORK: ${f}`);
    }
    if (r.warnings.length > 0) {
      for (const w of r.warnings.slice(0, 3)) {
        const short = w.split("\n")[0].slice(0, 150);
        console.log(`│  ⚠ WARN:    ${short}`);
      }
    }
    console.log("└─\n");
  }
}

main().catch(e => {
  console.error("Scanner crashed:", e.message);
  process.exit(1);
});
