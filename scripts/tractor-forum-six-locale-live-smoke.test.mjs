import {test} from "node:test";
import assert from "node:assert/strict";
import {verifyLiveRelease,approved,hidden} from "./tractor-forum-six-locale-live-smoke.mjs";

const origin="https://tractorvs.com";
const slug="2026-traktor-bayi-memnuniyeti-siralamasi-markalar-ve-puanlar-713ab252a9254ab7b2c8a30ce5b86706";
const path=l=>(l==="en"?"":"/"+l)+"/forum/"+slug+"/";
const url=l=>origin+path(l);
const html=locale=>{
 const alts=Object.entries(approved).map(([l,tag])=>'<link rel="alternate" hreflang="'+tag+'" href="'+url(l)+'">').join("");
 return '<html lang="'+approved[locale]+'"><head><link rel="canonical" href="'+url(locale)+'">'+alts+
  '<link rel="alternate" hreflang="x-default" href="'+url("en")+'">'+
  '<meta name="robots" content="index,follow,max-image-preview:large"></head><body><h1>2026</h1>'+
  'Same CLAAS Swaraj Yanmar TYM Gold Level climmar.com mechaman.nl rushlane.com equipmentdealermagazine.com'+
  'x'.repeat(3000)+'</body></html>';
};
function mockFetch({missingFr=false,leakEs=false,wrongAlternate=false}={}){
 return async requested=>{
  let body="",type="text/html",status=200;
  if(requested.endsWith("/robots.txt")){body="User-agent: *\nAllow: /\nSitemap: "+origin+"/sitemap-index.xml\n";type="text/plain";}
  else if(requested.endsWith("/sitemap-index.xml")){body="<sitemapindex><sitemap><loc>"+origin+"/forum-sitemap.xml</loc></sitemap></sitemapindex>";type="application/xml";}
  else if(requested.endsWith("/forum-sitemap.xml")){
   body="<urlset>"+Object.keys(approved).filter(l=>!(missingFr&&l==="fr")).concat(leakEs?["es"]:[]).map(l=>"<url><loc>"+url(l)+"</loc></url>").join("")+"</urlset>";
   type="application/xml";
  }else{
   const loc=Object.keys(approved).find(l=>url(l)===requested);
   if(!loc){status=404;body="404";}
   else{body=html(loc);if(wrongAlternate&&loc==="ru")body=body.replace('hreflang="fr" href="'+url("fr")+'"','hreflang="fr" href="'+url("ru")+'"');}
  }
  return {status,headers:{get:key=>key==="content-type"?type:null},text:async()=>body};
 };
}
test("production release can pass with six distinct correctly linked indexable pages",async()=>{
 const r=await verifyLiveRelease(mockFetch());
 assert.equal(r.ok,true,JSON.stringify(r.errors));
 assert.equal(r.html200,6);
});
test("missing approved sitemap locale and hidden locale leakage are release blocking",async()=>{
 const r=await verifyLiveRelease(mockFetch({missingFr:true,leakEs:true}));
 assert.equal(r.ok,false);
 assert.match(r.errors.join("; "),/missing fr approved topic/);
 assert.match(r.errors.join("; "),/hidden es topic leaked/);
});
test("broken reciprocal hreflang is release blocking",async()=>{
 const r=await verifyLiveRelease(mockFetch({wrongAlternate:true}));
 assert.equal(r.ok,false);
 assert.match(r.errors.join("; "),/ru: missing\/wrong hreflang fr/);
});
