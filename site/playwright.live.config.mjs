import { defineConfig, devices } from "@playwright/test";

// Separate read-only PRODUCTION browser suite. Never start the local preview
// server and never conflate successful static/offline checks with live evidence.
export default defineConfig({
  testDir: "./e2e",
  testMatch: "tractorvs-live-compare.spec.mjs",
  timeout: 90_000,
  expect: { timeout: 20_000 },
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: process.env.CI ? [["list"], ["html", {open:"never",outputFolder:"playwright-live-report"}], ...(process.env.PLAYWRIGHT_JSON_OUTPUT_FILE ? [["json",{outputFile:process.env.PLAYWRIGHT_JSON_OUTPUT_FILE}]] : [])] : "list",
  outputDir: "test-results-live",
  use: {
    baseURL: "https://tractorvs.com",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "off",
  },
  projects: [
    {name:"chromium",use:{...devices["Desktop Chrome"]}},
    {name:"firefox",use:{...devices["Desktop Firefox"]}},
    {name:"webkit",use:{...devices["Desktop Safari"]}},
    {name:"mobile-chromium",use:{...devices["Pixel 7"]}},
  ],
});
