import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";

const layout = readFileSync(new URL("../src/layouts/SiteLayout.astro", import.meta.url), "utf8");

test("canonical indexable pages expose one reliable Open Graph URL, but previews do not",()=>{
  assert.match(layout,/\{canonicalUrl && <meta property="og:url" content=\{canonicalUrl\} \/>\}/);
  assert.match(layout,/const canonicalUrl = indexingEnabled/);
  assert.match(layout,/new URL\(Astro\.url\.pathname, Astro\.site!\)/);
  assert.doesNotMatch(layout,/og:url" content=\{Astro\.url\.href\}/);
});

test("share metadata repeats actual localized title and summary without fabricated images",()=>{
  assert.match(layout,/<meta property="og:site_name" content=\{brand\.name\} \/>/);
  for(const name of ["twitter:title","twitter:description"]){
    assert.match(layout,new RegExp('<meta name="'+name+'" content=\\{(?:title|description)\\} \\/>'));
  }
  assert.match(layout,/ogImage \|\| brandShareImage \? "summary_large_image" : "summary"/);
  assert.match(layout,/\{ogImage && <meta property="og:image" content=\{ogImage\} \/>\}/);
  assert.match(layout,/\{ogImage && <meta name="twitter:image" content=\{ogImage\} \/>\}/);
  assert.doesNotMatch(layout,/invented-og-image|dummy-share-photo|stock-photo/);
});

test("only genuinely available locales receive social alternate tags",()=>{
  assert.match(layout,/indexableLocales\.filter\(\(locale\) => locale !== lang\)/);
  assert.match(layout,/<meta property="og:locale:alternate" content=\{openGraphLocale\[locale\]\} \/>/);
  assert.match(layout,/const openGraphLocale: Record<Locale, string>/);
});


test("indexable pages without a licensed photo use only the first-party branded 1200x630 PNG",()=>{
  assert.match(layout,/const brandShareImage = indexingEnabled && Astro\.site/);
  assert.match(layout,/tractorvs-share-card\.png/);
  assert.match(layout,/!ogImage && brandShareImage && <meta property="og:image" content=\{brandShareImage\}/);
  assert.match(layout,/!ogImage && brandShareImage && <meta name="twitter:image" content=\{brandShareImage\}/);
  assert.match(layout,/og:image:width" content="1200"/);
  assert.match(layout,/og:image:height" content="630"/);
});
