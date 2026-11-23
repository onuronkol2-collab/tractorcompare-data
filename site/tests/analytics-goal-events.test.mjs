import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {LOCALES} from "../src/lib/locales.ts";
import {analyticsGoalForPath} from "../src/lib/analytics-goals.ts";

test("only real, defined product destinations generate analytics events in all ten locales",()=>{
  assert.equal(LOCALES.length,10);
  for (const locale of LOCALES) {
    const prefix=locale==="en"?"":"/"+locale;
    assert.equal(analyticsGoalForPath(prefix+"/farm-advisor/"),"tractor_advisor_view",locale);
    assert.equal(analyticsGoalForPath(prefix+"/compare/"),"tractor_compare_view",locale);
    assert.equal(analyticsGoalForPath(prefix+"/compare/deutz-fahr-5090-d-gs-vs-5100-d-gs/"),
      "tractor_comparison_read",locale);
    assert.equal(analyticsGoalForPath(prefix+"/tractors/basak-traktor-5120-01590869/"),
      "tractor_model_view",locale);
  }
});

test("analytics never invents events for lists, user content, unknown or external paths",()=>{
  for (const path of [
    "/", "/tr/", "/tractors/", "/tr/tractors/", "/brands/mccormick/",
    "/articles/", "/tr/forum/", "/tr/reviews/basak-2075-bk/",
    "/tr/farm-advisor/extra/", "/fake/tr/compare/",
    "/en/compare/", "https://elsewhere.example/compare/", "//elsewhere.example/compare/",
    "/tr/tractors/some-model/?q=private", ""
  ]) {
    assert.equal(analyticsGoalForPath(path),null,path);
  }
});

test("analytics-goal events can only be queued inside the existing opt-in tag loader",()=>{
  const source=readFileSync(new URL("../src/components/AnalyticsConsent.astro",import.meta.url),"utf8");
  assert.match(source,/import \{ analyticsGoalForPath \} from "\.\.\/lib\/analytics-goals\.ts"/);
  const start=source.indexOf("function loadAnalyticsOnlyAfterConsent()");
  const end=source.indexOf("// Clarity is strictly opt-in",start);
  const gated=source.slice(start,end);
  assert.ok(start>=0&&end>start);
  const grant=gated.indexOf('analyticsWindow.gtag("consent", "update"');
  const config=gated.indexOf('analyticsWindow.gtag("config"');
  const event=gated.indexOf('analyticsWindow.gtag("event", goal)');
  const network=gated.indexOf("document.head.appendChild(script)");
  assert.ok(grant>=0&&grant<config&&config<event&&event<network,
    "grant, GA4 configuration and optional goal must be queued in order before loading");
  assert.match(gated,/const goal = analyticsGoalForPath\(window\.location\.pathname\)/);
  assert.match(source,/if \(choice === "accepted"\) \{\s*loadAnalyticsOnlyAfterConsent\(\);/);
  assert.match(source,/if \(current === "accepted"\) \{\s*loadAnalyticsOnlyAfterConsent\(\);/);
});
