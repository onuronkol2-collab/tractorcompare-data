import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import { LOCALES } from "../src/lib/locales.ts";
import {ANALYTICS_TEXT, GA4_MEASUREMENT_ID, ANALYTICS_CHOICE_KEY, analyticsText} from "../src/lib/analytics-i18n.ts";

const read=(file)=>readFileSync(new URL("../"+file,import.meta.url),"utf8");
const banner=read("src/components/AnalyticsConsent.astro");
const layout=read("src/layouts/SiteLayout.astro");
const privacy=read("src/components/AnalyticsPrivacy.astro");

test("TractorVS uses exact user-provided GA4 measurement ID (never GTM container ID)",()=>{
  assert.equal(GA4_MEASUREMENT_ID,"G-PZCNNEY1VN");
  assert.match(GA4_MEASUREMENT_ID,/^G-[A-Z0-9]+$/);
  assert.match(ANALYTICS_CHOICE_KEY,/^tractorvs_/);
  assert.doesNotMatch(banner,/GTM-KHBZKLHW/);
  assert.doesNotMatch(banner,/gtm\.js/);
});

test("all ten languages have meaningful accept, reject and preference controls",()=>{
  assert.equal(LOCALES.length,10);
  assert.deepEqual(Object.keys(ANALYTICS_TEXT).sort(),[...LOCALES].sort());
  const expected=Object.keys(analyticsText("en"));
  for(const locale of LOCALES){
    const copy=analyticsText(locale);
    assert.deepEqual(Object.keys(copy),expected);
    for(const [key,value] of Object.entries(copy)){
      assert.ok(typeof value==="string"&&value.trim().length>2,locale+" missing "+key);
    }
    assert.notEqual(copy.accept,copy.reject);
    assert.notEqual(copy.privacyTitle,copy.consentTitle);
  }
});

test("Google Analytics JS has a strict explicit opt-in gate and consent can be revoked",()=>{
  assert.match(banner,/hidden\s+aria-labelledby/);
  assert.match(banner,/function storedChoice\(\)/);
  assert.match(banner,/window\.localStorage\.getItem\(ANALYTICS_CHOICE_KEY\)/);
  assert.match(banner,/function loadAnalyticsOnlyAfterConsent\(\)/);
  assert.match(banner,/function choose\(choice: AnalyticsChoice\)/);
  assert.match(banner,/if \(choice === "accepted"\) \{\s*loadAnalyticsOnlyAfterConsent/);
  assert.match(banner,/if \(current === "accepted"\) \{\s*loadAnalyticsOnlyAfterConsent/);
  assert.match(banner,/script\.src = "https:\/\/www\.googletagmanager\.com\/gtag\/js\?id="/);
  assert.match(banner,/analytics_storage: "denied"/);
  assert.match(banner,/window\.location\.reload\(\)/);
  assert.match(banner,/clearAnalyticsFirstPartyCookies\(\)/);
  assert.doesNotMatch(banner,/<script\s+(?:src|async)/);
  assert.doesNotMatch(layout,/googletagmanager\.com|gtag\/js\?id/);
  assert.match(layout,/<AnalyticsConsent lang=\{lang\}/);
  assert.match(layout,/id="tractorvs-analytics-settings"/);
  assert.match(layout,/localizedPath\(lang,"\/privacy\/"\)/);
});

test("privacy and opt-in choices are available on actual ten-language static routes",()=>{
  for(const locale of LOCALES){
    const page=locale==="en"?"src/pages/privacy/index.astro":
      locale==="tr"?"src/pages/tr/privacy/index.astro":"src/pages/[locale]/privacy/index.astro";
    assert.ok(read(page).includes("AnalyticsPrivacy"));
    assert.ok(analyticsText(locale).privacyCollect.length>40);
    assert.ok(analyticsText(locale).privacyChoice.length>40);
  }
  assert.match(read("src/pages/[locale]/privacy/index.astro"),/NEW_LOCALES/);
  assert.match(privacy,/https:\/\/policies\.google\.com\/technologies\/partner-sites/);
  assert.match(privacy,/copy\.privacyCollect/);
  assert.match(privacy,/copy\.privacyChoice/);
  assert.match(read("src/styles/global.css"),/\.footer-analytics-settings:focus-visible/);
});

test("consent mode v2 explicitly grants analytics but never advertising before GA4 config",()=>{
  const analyticsStart=banner.indexOf('function loadAnalyticsOnlyAfterConsent()');
  const code=banner.slice(analyticsStart,banner.indexOf('function clearAnalyticsFirstPartyCookies()',analyticsStart));
  const defaultAt=code.indexOf('analyticsWindow.gtag("consent", "default"');
  const updateAt=code.indexOf('analyticsWindow.gtag("consent", "update"');
  const configAt=code.indexOf('analyticsWindow.gtag("config"');
  const requestAt=code.indexOf('document.head.appendChild(script)');
  assert.ok(defaultAt>=0&&updateAt>defaultAt&&configAt>updateAt&&requestAt>configAt,
    "Explicit consent default and grant must precede GA4 config and network loading");
  assert.match(code,/analytics_storage:\s*"granted"/);
  for(const key of ["ad_storage","ad_user_data","ad_personalization"]){
    assert.match(code,new RegExp(key+':\\\\s*"denied"'));
    assert.doesNotMatch(code,new RegExp(key+':\\\\s*"granted"'));
  }
  assert.match(banner,/if \(choice === "accepted"\)/);
  assert.match(banner,/if \(current === "accepted"\)/);
  assert.doesNotMatch(layout,/gtag\/js\?id|google-analytics\.com/);
});
