import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { analyticsEnvironment, isGoogleAccountReferral } from "../src/lib/analytics-environment.ts";

test("only the canonical HTTPS production origin can fetch real analytics", () => {
  for (const path of ["/","/tr/","/ja/compare/?utm_source=chatgpt.com","/fr/tractors/#specs"]) {
    assert.equal(analyticsEnvironment("https://tractorvs.com"+path),"production");
  }
  for (const href of ["https://tractorvs.com.evil.example/","https://tractorvs.com@evil.example/","https://user@tractorvs.com/","https://tractorvs.com:444/","http://tractorvs.com/","https://preview.tractorvs.com/","https://tractorvs.pages.dev/","https://www.tractorvs.com/","not a URL","file:///tmp/test"]) {
    assert.equal(analyticsEnvironment(href),"off",href);
  }
  for (const href of ["http://localhost:4321/","http://127.0.0.1:4173/tr/","http://[::1]:4173/"]) {
    assert.equal(analyticsEnvironment(href),"local-fixture",href);
  }
  assert.equal(analyticsEnvironment("https://localhost.evil.example/"),"off");
});

test("auth callback payloads are never passed to measurement providers", () => {
  for (const suffix of ["?code=fixture","#access_token=fixture&refresh_token=fixture","?token_hash=fixture","#provider_token=fixture","?error_code=fixture","#error_description=fixture","?CODE=fixture"]) {
    assert.equal(analyticsEnvironment("https://tractorvs.com/tr/forum/"+suffix),"off",suffix);
  }
  assert.equal(analyticsEnvironment("https://tractorvs.com/tr/compare/?models=fixture"),"production");
});

test("only the exact Google account origin is classified as an auth referral", () => {
  assert.equal(isGoogleAccountReferral("https://accounts.google.com/"),true);
  for (const ref of ["","https://www.google.com/","https://chatgpt.com/","https://github.com/","https://accounts.google.com.evil.example/","https://accounts.google.com@evil.example/","https://user@accounts.google.com/","https://accounts.google.com:444/","http://accounts.google.com/"]) {
    assert.equal(isGoogleAccountReferral(ref),false,ref);
  }
});

test("every provider checks the environment and local fixtures cannot execute scripts", () => {
  const source = readFileSync(new URL("../src/components/AnalyticsConsent.astro",import.meta.url),"utf8");
  for (const name of ["loadAnalyticsOnlyAfterConsent","loadClarityOnlyAfterConsent","loadCloudflareOnlyAfterConsent"]) {
    assert.ok(source.includes("function "+name+'() {\n    if (environment === "off") return;'));
  }
  assert.equal(source.split('if (environment === "local-fixture") script.type = "application/json";').length-1,3);
  assert.equal(source.split("document.head.appendChild(script);").length-1,3);
  assert.ok(source.includes("isGoogleAccountReferral(document.referrer) ? { ignore_referrer: true } : {}"));
});
