import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";

const read=(path)=>readFileSync(new URL("../src/"+path,import.meta.url),"utf8");
const layout=read("layouts/SiteLayout.astro");
const css=read("styles/interaction-accessibility.css");


test("every localized page has a focusable skip-to-content target and a shared accessibility stylesheet",()=>{
 assert.match(layout,/<a class="skip-link" href="#main">/);
 assert.match(layout,/<main id="main" tabindex="-1">/);
 assert.match(layout,/import "\.\.\/styles\/interaction-accessibility\.css";/);
 assert.doesNotMatch(css,/display:\s*none|visibility:\s*hidden|overflow:\s*hidden/);
});
test("sitewide links and controls expose visible keyboard focus on light and dark backgrounds",()=>{
 assert.match(css,/:where\(a, button, summary, input, select, textarea, \[tabindex="0"\]\):focus-visible/);
 assert.match(css,/outline:\s*3px solid #175c37/);
 assert.match(css,/\.site-header, \.site-footer, \.hero-section, \.model-hero/);
 assert.match(css,/outline-color:\s*#b7df91/);
});
test("reduced-motion preference turns off smooth scroll, animation and transition globally",()=>{
 assert.match(css,/@media \(prefers-reduced-motion: reduce\)/);
 assert.match(css,/scroll-behavior:\s*auto/);
 assert.match(css,/animation-duration:\s*0\.01ms !important/);
 assert.match(css,/transition-duration:\s*0\.01ms !important/);
});
test("model HTML and editorial content remain unchanged by the shared stylesheet",()=>{
 assert.doesNotMatch(css,/\\.model-spec-card|content:\\s*["\']/);
});
