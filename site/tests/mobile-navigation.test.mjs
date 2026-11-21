import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
const html=readFileSync(new URL("../src/layouts/SiteLayout.astro",import.meta.url),"utf8");
const css=readFileSync(new URL("../src/styles/global.css",import.meta.url),"utf8");

test("mobile navigation uses native details and optional keyboard enhancements",()=>{
  assert.match(html, /<details class="mobile-nav" data-site-disclosure>/);
  assert.match(html, /<summary aria-label=\{t\(lang,"navMain"\)\}/);
  assert.match(html, /<nav class="mobile-nav-links"/);
  assert.match(css, /@media \(max-width:720px\) \{\s*\.mobile-nav \{ display: block/);
});
test("mobile navigation links to catalogue, comparison, and farm advisor in each locale",()=>{
  const menu=html.split('<nav class="mobile-nav-links"')[1]?.split("</nav>")[0] || "";
  for(const path of ["catalogPath","comparePath","advisorPath"]){
    assert.match(menu,new RegExp("href=\\{"+path+"\\}"));
  }
});
test("touch target and keyboard focus are visible",()=>{
  assert.match(css,/\.mobile-nav > summary \{[^}]*min-height: 44px/s);
  assert.match(css,/\.mobile-nav > summary:focus-visible/);
});
