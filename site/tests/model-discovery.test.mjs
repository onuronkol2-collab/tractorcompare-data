import {test} from "node:test";
import assert from "node:assert/strict";
import {PUBLIC_LOCALES,PUBLIC_LOCALE_TAGS,verifyModelDiscoveryMarkup}
  from "../scripts/verify-published-site-inventory.mjs";

const origin="https://tractorvs.com";
const slug="belarus-132n-ffdd0c11";
const pathFor=(locale)=>"/"+(locale==="en"?"":locale+"/")+"tractors/"+slug+"/";
function validMarkup(locale){
 const path=pathFor(locale);
 const head=[
  '<meta name="robots" content="index,follow,max-image-preview:large" />',
  '<link rel="canonical" href="'+origin+path+'" />',
  ...Object.entries(PUBLIC_LOCALE_TAGS).map(([lang,tag])=>
   '<link rel="alternate" hreflang="'+tag+'" href="'+origin+pathFor(lang)+'" />'
  ),
  '<link rel="alternate" hreflang="x-default" href="'+origin+pathFor("en")+'" />'
 ];
 return "<html><head>"+head.join("")+"</head><body><main>Verified model</main></body></html>";
}

test("every published language requires its matching canonical, all 10 alternatives and HTML catalogue link",()=>{
 assert.equal(PUBLIC_LOCALES.length,10);
 for(const locale of PUBLIC_LOCALES){
  const markup=validMarkup(locale);
  assert.equal(verifyModelDiscoveryMarkup({
   html:markup,locale,slug,origin,catalogLinks:new Set([pathFor(locale)])
  }),true,locale);
 }
});

test("release gate rejects model pages not linked from their own language catalogue",()=>{
 assert.throws(()=>verifyModelDiscoveryMarkup({
  html:validMarkup("tr"),locale:"tr",slug,origin,catalogLinks:new Set()
 }),/Missing server-rendered catalogue link/);
});

test("release gate blocks a missing reciprocal alternate language",()=>{
 const html=validMarkup("tr").replace(
  '<link rel="alternate" hreflang="de" href="'+origin+pathFor("de")+'" />',""
 );
 assert.throws(()=>verifyModelDiscoveryMarkup({
  html,locale:"tr",slug,origin,catalogLinks:new Set([pathFor("tr")])
 }),/Missing reciprocal hreflang de/);
});

test("release gate blocks noindex, wrong canonical and missing x-default",()=>{
 const base=validMarkup("en");
 const variants=[
  [base.replace("index,follow","noindex,nofollow"),/not explicitly indexable|has noindex/],
  [base.replace('rel="canonical" href="'+origin+pathFor("en")+'"',
    'rel="canonical" href="https://example.invalid/"'),/canonical/],
  [base.replace('<link rel="alternate" hreflang="x-default" href="'+origin+pathFor("en")+'" />',""),
   /Missing x-default/],
 ];
 for(const [html,reason] of variants){
  assert.throws(()=>verifyModelDiscoveryMarkup({
   html,locale:"en",slug,origin,catalogLinks:new Set([pathFor("en")])
  }),reason);
 }
});
