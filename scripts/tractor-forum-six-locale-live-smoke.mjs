/**
 * TractorVS production-only forum publication smoke test with reviewed locale authorization record.
 * Read-only, no credentials or bypasses. Fails closed for canonical, hreflang and sitemap loss.
 */
import {fileURLToPath} from "node:url";
import {readFileSync} from "node:fs";
const origin="https://tractorvs.com";
const slug="2026-traktor-bayi-memnuniyeti-siralamasi-markalar-ve-puanlar-713ab252a9254ab7b2c8a30ce5b86706";
export const approved={en:"en",tr:"tr",de:"de",fr:"fr","pt-br":"pt-BR",ru:"ru"};
export const hidden=["es","hi","ja","zh"];
const supported=Object.freeze({...approved,es:"es",hi:"hi",ja:"ja",zh:"zh-Hans"});
const manifest=JSON.parse(readFileSync(new URL("./forum-smoke-approved-locales.json",import.meta.url),"utf8"));
export function approvedLocaleMap(record){
 if(record?.schema!=="tractorvs-forum-smoke-approval-v1"||record.topicId!=="713ab252-a925-4ab7-b2c8-a30ce5b86706"||
  !Array.isArray(record.approvedLocales)||!Array.isArray(record.heldLocales)||
  !/^\d{4}-\d{2}-\d{2}$/.test(record.reviewDate||"")||
  !/^https:\/\/github\.com\/onuronkol2-collab\/tractorcompare-data\/issues\/\d+#issuecomment-\d+$/.test(record.evidence||"")||
  !Number.isSafeInteger(record.syncPR)||record.syncPR<1)throw Error("FORUM_APPROVAL_RECORD_INVALID");
 const all=[...record.approvedLocales,...record.heldLocales];
 if(all.length!==Object.keys(supported).length||new Set(all).size!==all.length||all.some(l=>!Object.hasOwn(supported,l))||
 !record.approvedLocales.includes("en")||!record.approvedLocales.includes("tr"))throw Error("FORUM_APPROVAL_LOCALE_PARTITION_INVALID");
 return Object.fromEntries(record.approvedLocales.map(l=>[l,supported[l]]));
}
export const reviewedApproval=Object.freeze(manifest);
const path=l=>(l==="en"?"":"/"+l)+"/forum/"+slug+"/";
const absolute=l=>origin+path(l);
function tags(html,name){return [...html.matchAll(new RegExp("<"+name+"\\b[^>]*>","gi"))].map(x=>x[0]);}
function attr(tag,name){const m=tag.match(new RegExp("(?:^|\\s)"+name+"\\s*=\\s*(?:\"([^\"]*)\"|'([^']*)')","i"));return m?(m[1]??m[2]):null;}
function links(html,rel){return tags(html,"link").filter(t=>attr(t,"rel")===rel);}
function xmlLocs(xml){return [...xml.matchAll(/<loc>\s*([^<]+)\s*<\/loc>/g)].map(x=>x[1].replaceAll("&amp;","&"));}
async function get(url,fetchFn){const r=await fetchFn(url,{redirect:"manual",cache:"no-store",signal:AbortSignal.timeout(25000),headers:{"User-Agent":"TractorVS-live-release-proof/1.0","Accept":"text/html,application/xml,text/plain"}});return {url,status:r.status,contentType:r.headers.get("content-type")||"",body:(await r.text()).slice(0,4000000)};}
export async function verifyLiveRelease(fetchFn=fetch,record=reviewedApproval){
 const approved=approvedLocaleMap(record),hidden=record.heldLocales,locales=Object.keys(approved);
 const req=[origin+"/robots.txt",origin+"/sitemap-index.xml",origin+"/forum-sitemap.xml",...locales.map(absolute)];
 const fetched=await Promise.all(req.map(url=>get(url,fetchFn)));
 const [robots,index,forum,...pages]=fetched,errors=[];
 const assert=(condition,context)=>{if(!condition)errors.push(context);};
 assert(robots.status===200,"robots: HTTP "+robots.status);
 assert(robots.body.includes("Sitemap: "+origin+"/sitemap-index.xml"),"robots: no main sitemap declaration");
 assert(!/^Disallow:\s*\/\s*$/m.test(robots.body),"robots: Disallow /");
 assert(index.status===200&&/xml/i.test(index.contentType),"master sitemap: not HTTP 200 XML");
 assert(xmlLocs(index.body).includes(origin+"/forum-sitemap.xml"),"master sitemap: forum sitemap absent");
 assert(forum.status===200&&/xml/i.test(forum.contentType),"forum sitemap: not HTTP 200 XML");
 const locs=xmlLocs(forum.body);
 for(const l of locales)assert(locs.filter(url=>url===absolute(l)).length===1,"forum sitemap: missing "+l+" approved topic or duplicate");
 for(const l of hidden)assert(!locs.includes(absolute(l)),"forum sitemap: hidden "+l+" topic leaked");
 for(let i=0;i<locales.length;i++){
  const locale=locales[i],p=pages[i],html=p.body,canon=links(html,"canonical"),alts=links(html,"alternate");
  const meta=tags(html,"meta").filter(t=>attr(t,"name")==="robots").map(t=>attr(t,"content")||"");
  assert(p.status===200 && /text\/html/i.test(p.contentType),locale+": not 200 HTML ("+p.status+")");
  assert(html.length>2500,locale+": HTML too short");
  assert(attr(tags(html,"html")[0]||"","lang")===approved[locale],locale+": wrong document lang");
  assert(tags(html,"h1").length===1,locale+": missing or duplicated H1");
  assert(meta.some(t=>t.startsWith("index,follow")),locale+": robots meta is not indexable");
  assert(canon.length===1&&attr(canon[0],"href")===absolute(locale),locale+": missing/wrong self canonical");
  const alternateRows=alts.filter(t=>attr(t,"hreflang")).map(t=>[attr(t,"hreflang"),attr(t,"href")]);
  const languages=new Map(alternateRows);
  assert(languages.size===alternateRows.length,locale+": duplicate hreflang");
  assert(languages.size===locales.length+1,locale+": unexpected hreflang inventory");
  for(const [l,tag] of Object.entries(approved))assert(languages.get(tag)===absolute(l),locale+": missing/wrong hreflang "+tag);
  assert(languages.get("x-default")===absolute("en"),locale+": missing x-default EN URL");
  for(const h of hidden)assert(!languages.has(supported[h])&&!languages.has(h),locale+": hidden locale in hreflang "+h);
  for(const fact of ["Same","CLAAS","Swaraj","Yanmar","TYM","Gold Level"])
   assert(html.includes(fact),locale+": missing source-backed fact "+fact);
  for(const domain of ["climmar.com","mechaman.nl","rushlane.com","equipmentdealermagazine.com"])
   assert(html.includes(domain),locale+": missing source "+domain);
 }
 return {ok:errors.length===0,topic:slug,origin,approvalEvidence:record.evidence,approved:locales,html200:pages.filter(p=>p.status===200&&/text\/html/.test(p.contentType)).length,forumSitemapLocs:locs.length,errors};
}
if(process.argv[1]&&fileURLToPath(import.meta.url)===process.argv[1]){
 try{const r=await verifyLiveRelease();console.log("TRACTORVS_SIX_LOCALE_LIVE_PROOF "+JSON.stringify(r));if(!r.ok)process.exitCode=1;}
 catch(e){console.error("TRACTORVS_SIX_LOCALE_LIVE_PROOF_FAIL "+String(e));process.exitCode=1;}
}
