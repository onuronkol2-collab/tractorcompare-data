import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {LOCALES} from "../src/lib/locales.ts";
import {analyticsText} from "../src/lib/analytics-i18n.ts";

const source=readFileSync(new URL("../src/components/AnalyticsConsent.astro",import.meta.url),"utf8");
const script=source.slice(source.indexOf("<script>"),source.indexOf("</script>")+9);

test("small consent card is genuinely concise but discloses all providers in ten languages",()=>{
 assert.equal(LOCALES.length,10);
 for(const lang of LOCALES){
  const copy=analyticsText(lang);
  assert.ok(copy.consentCompact.length>80,lang+" summary missing");
  assert.ok(copy.consentCompact.length<400,lang+" summary excessively long");
  assert.ok(copy.consentCompact.includes("Google Analytics"),lang+" Google");
  assert.ok(copy.consentCompact.includes("Microsoft Clarity"),lang+" Clarity");
  assert.ok(copy.consentCompact.includes("Cloudflare"),lang+" Cloudflare");
  assert.ok(copy.consentDetails.length>2,lang+" disclosure label");
  assert.ok(copy.privacyLink.length>2,lang+" privacy link");
 }
});
test("compact banner retains opt-in and full disclosures without a preselected choice",()=>{
 assert.match(source,/<aside id="tractorvs-analytics-banner"[^>]*hidden/);
 assert.match(source,/aria-describedby="tractorvs-analytics-summary"/);
 assert.match(source,/<p id="tractorvs-analytics-summary">\{c\.consentCompact\}<\/p>/);
 assert.match(source,/<details class="tractorvs-analytics-more">/);
 assert.match(source,/<summary>\{c\.consentDetails\}<\/summary>/);
 for(const id of ["tractorvs-analytics-description","tractorvs-clarity-description","tractorvs-cloudflare-description","tractorvs-analytics-reject","tractorvs-analytics-accept"])
  assert.ok(source.includes('id="'+id+'"'),id);
 assert.match(source,/href=\{localizedPath\(lang,"\/privacy\/"\)\}/);
 assert.match(source,/min-height:\s*44px/);
 assert.match(source,/max-height:\s*75dvh/);
 assert.match(source,/:is\(button,a,summary\):focus-visible/);
 assert.doesNotMatch(source,/<input[^>]*checked/i);
});
test("visual-only change preserves exact consent script gating",()=>{
 assert.match(script,/if \(current === "accepted"\)/);
 assert.match(script,/if \(choice === "accepted"\)/);
 assert.match(script,/loadAnalyticsOnlyAfterConsent\(\)/);
 assert.match(script,/loadClarityOnlyAfterConsent\(\)/);
 assert.match(script,/loadCloudflareOnlyAfterConsent\(\)/);
 assert.match(script,/window\.localStorage\.setItem\(ANALYTICS_CHOICE_KEY, choice\)/);
 assert.match(script,/clearClarityFirstPartyCookies\(\)/);
 assert.match(script,/clearAnalyticsFirstPartyCookies\(\)/);
 assert.match(script,/openSettings\?\.addEventListener/);
});
