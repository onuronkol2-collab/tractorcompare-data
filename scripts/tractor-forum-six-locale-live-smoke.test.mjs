import {test} from "node:test";
import assert from "node:assert/strict";
import {verifyLiveRelease,approved,hidden,reviewedApproval,approvedLocaleMap} from "./tractor-forum-six-locale-live-smoke.mjs";

const origin="https://tractorvs.com";
const slug="2026-traktor-bayi-memnuniyeti-siralamasi-markalar-ve-puanlar-713ab252a9254ab7b2c8a30ce5b86706";
const path=l=>(l==="en"?"":"/"+l)+"/forum/"+slug+"/";
const url=l=>origin+path(l);
const sixRecord={...reviewedApproval,approvedLocales:Object.keys(approved),heldLocales:hidden};
const html=(locale,map)=>{
 const alts=Object.entries(map).map(([l,tag])=>'<link rel="alternate" hreflang="'+tag+'" href="'+url(l)+'">').join("");
 return '<html lang="'+map[locale]+'"><head><link rel="canonical" href="'+url(locale)+'">'+alts+
  '<link rel="alternate" hreflang="x-default" href="'+url("en")+'">'+
  '<meta name="robots" content="index,follow,max-image-preview:large"></head><body><h1>2026</h1>'+
  'Same CLAAS Swaraj Yanmar TYM Gold Level climmar.com mechaman.nl rushlane.com equipmentdealermagazine.com'+
  'x'.repeat(3000)+'</body></html>';
};
function mockFetch({missingFr=false,leakEs=false,wrongAlternate=false,record=sixRecord,duplicateAlternate=false,duplicateSitemap=false,wrongZh=false}={}){
 const map=approvedLocaleMap(record);
 return async requested=>{
  let body="",type="text/html",status=200;
  if(requested.endsWith("/robots.txt")){body="User-agent: *\nAllow: /\nSitemap: "+origin+"/sitemap-index.xml\n";type="text/plain";}
  else if(requested.endsWith("/sitemap-index.xml")){body="<sitemapindex><sitemap><loc>"+origin+"/forum-sitemap.xml</loc></sitemap></sitemapindex>";type="application/xml";}
  else if(requested.endsWith("/forum-sitemap.xml")){
   body="<urlset>"+Object.keys(map).filter(l=>!(missingFr&&l==="fr")).concat(leakEs?["es"]:[]).concat(duplicateSitemap?["en"]:[]).map(l=>"<url><loc>"+url(l)+"</loc></url>").join("")+"</urlset>";
   type="application/xml";
  }else{
   const loc=Object.keys(map).find(l=>url(l)===requested);
   if(!loc){status=404;body="404";}
   else{body=html(loc,map);if(duplicateAlternate)body=body.replace("</head>",'<link rel="alternate" hreflang="en" href="'+url("en")+'"> </head>');if(wrongZh&&loc==="zh")body=body.replace('lang="zh-Hans"','lang="zh"');if(wrongAlternate&&loc==="ru")body=body.replace('hreflang="fr" href="'+url("fr")+'"','hreflang="fr" href="'+url("ru")+'"');}
  }
  return {status,headers:{get:key=>key==="content-type"?type:null},text:async()=>body};
 };
}
test("production release can pass with six distinct correctly linked indexable pages",async()=>{
 const r=await verifyLiveRelease(mockFetch(),sixRecord);
 assert.equal(r.ok,true,JSON.stringify(r.errors));
 assert.equal(r.html200,6);
});
test("missing approved sitemap locale and hidden locale leakage are release blocking",async()=>{
 const r=await verifyLiveRelease(mockFetch({missingFr:true,leakEs:true}),sixRecord);
 assert.equal(r.ok,false);
 assert.match(r.errors.join("; "),/missing fr approved topic/);
 assert.match(r.errors.join("; "),/hidden es topic leaked/);
});
test("broken reciprocal hreflang is release blocking",async()=>{
 const r=await verifyLiveRelease(mockFetch({wrongAlternate:true}),sixRecord);
 assert.equal(r.ok,false);
 assert.match(r.errors.join("; "),/ru: missing\/wrong hreflang fr/);
});

test("ten independently approved locales are all checked, including exact zh-Hans",async()=>{
 const r=await verifyLiveRelease(mockFetch({record:reviewedApproval}),reviewedApproval);
 assert.equal(r.ok,true,JSON.stringify(r.errors));assert.equal(r.html200,10);
});
test("duplicates in sitemap or hreflang remain failures",async()=>{
 const r=await verifyLiveRelease(mockFetch({duplicateAlternate:true,duplicateSitemap:true}),sixRecord);
 assert.equal(r.ok,false);assert.match(r.errors.join(";"),/duplicate hreflang/);assert.match(r.errors.join(";"),/duplicate/);
});
test("unreviewed or duplicated locale partition fails before network",async()=>{
 let calls=0;const fetchFn=async()=>{calls++;throw Error("unexpected")};
 for(const record of [{...sixRecord,approvedLocales:[...sixRecord.approvedLocales,"es"]},{...sixRecord,evidence:"https://tractorvs.com"},{...sixRecord,heldLocales:["es","hi","ja","xx"]}])await assert.rejects(verifyLiveRelease(fetchFn,record),/FORUM_APPROVAL_/);
 assert.equal(calls,0);
});
test("wrong Chinese language metadata does not pass",async()=>{
 const r=await verifyLiveRelease(mockFetch({record:reviewedApproval,wrongZh:true}),reviewedApproval);
 assert.equal(r.ok,false);assert.match(r.errors.join(";"),/zh: wrong document lang/);
});
