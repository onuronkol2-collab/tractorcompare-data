import {readFileSync} from "node:fs";
import {pathToFileURL} from "node:url";

const locales = ["en","tr","zh","hi","pt-br","fr","de","ru","ja","es"];
const browsers = ["chromium","firefox","webkit","mobile-chromium"];

/** Fail closed: a successful Playwright exit alone can include skipped tests. */
export function verifyResearchReport(report) {
  const expected = new Set(locales.flatMap(lang => browsers.map(browser => lang + "/" + browser)));
  const seen = new Set();
  const stats = report?.stats;
  if (!stats || stats.skipped !== 0 || stats.unexpected !== 0 || stats.flaky !== 0 ||
      !Number.isInteger(stats.expected) || stats.expected < expected.size ||
      !Array.isArray(report.suites) || !Array.isArray(report.errors) || report.errors.length) {
    throw new Error("Incomplete, skipped, failed or flaky production QA report");
  }
  let executed = 0;
  function visit(suite) {
    for (const spec of suite.specs ?? []) {
      if (!Array.isArray(spec.tests) || !spec.tests.length) throw new Error("Missing test evidence");
      for (const test of spec.tests) {
        if (test.status !== "expected" || test.expectedStatus !== "passed" ||
            !Array.isArray(test.results) || test.results.length !== 1 ||
            test.results[0].status !== "passed") {
          throw new Error("Non-passing or retried test: " + spec.title + " / " + test.projectName);
        }
        executed++;
        const locale = /^live ([a-z-]+) licensed tractor research,/.exec(spec.title)?.[1];
        if (locale) {
          const key = locale + "/" + test.projectName;
          if (!expected.has(key) || seen.has(key)) throw new Error("Unexpected or duplicate journey: " + key);
          seen.add(key);
        }
      }
    }
    for (const child of suite.suites ?? []) visit(child);
  }
  report.suites.forEach(visit);
  const missing = [...expected].filter(key => !seen.has(key));
  if (missing.length || executed !== stats.expected) throw new Error("Missing journeys or inconsistent report: " + missing.join(", "));
  return {required: expected.size, passed: seen.size, executed, skipped: 0, flaky: 0};
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    const result = verifyResearchReport(JSON.parse(readFileSync(process.argv[2], "utf8")));
    console.log("TRACTORVS_RESEARCH_QA_EVIDENCE " + JSON.stringify(result));
  } catch (error) {
    console.error("Production research QA evidence rejected: " + error.message);
    process.exitCode = 1;
  }
}
