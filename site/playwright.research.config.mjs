import {defineConfig,devices} from "@playwright/test";

/** Dedicated, read-only production UX checks. Never touches Supabase, forum,
 * authentication, analytics consent, paid crawlers or local preview data. */
export default defineConfig({
  testDir:"./e2e-live",
  testMatch:"tractorvs-research.spec.mjs",
  timeout:110_000,
  expect:{timeout:20000},
  fullyParallel:false,
  forbidOnly:Boolean(process.env.CI),
  retries:process.env.CI?1:0,
  workers:1,
  reporter:process.env.CI?[["list"],["html",{open:"never",outputFolder:"playwright-research-report"}],["json",{outputFile:process.env.RESEARCH_QA_JSON_REPORT || "playwright-research-evidence.json"}]]:"list",
  outputDir:"test-results-research",
  use:{baseURL:"https://tractorvs.com",trace:"retain-on-failure",screenshot:"only-on-failure",video:"off"},
  projects:[
    {name:"chromium",use:{...devices["Desktop Chrome"]}},
    {name:"firefox",use:{...devices["Desktop Firefox"]}},
    {name:"webkit",use:{...devices["Desktop Safari"]}},
    {name:"mobile-chromium",use:{...devices["Pixel 7"]}},
  ],
});
