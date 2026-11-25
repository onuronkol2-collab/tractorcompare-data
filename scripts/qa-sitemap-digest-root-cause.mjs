// Diagnostic only. Never writes the provenance ledger or deploys.
import {readFileSync} from "node:fs";
import {join} from "node:path";
import {extractPublishedUrls,significantContentDigest} from "./tractor-sitemap-history.mjs";
import {createHash} from "node:crypto";
const [oldDist,newDist,ledgerPath]=process.argv.slice(2);
const oldUrls=new Set(extractPublishedUrls(oldDist));
const newUrls=extractPublishedUrls(newDist);
const ledger=JSON.parse(readFileSync(ledgerPath,"utf8")).pages;
const normalize=s=>s.replace(/\s+/g," ").trim();
const main=s=>normalize(s.match(/<main\b[^>]*>([\s\S]*?)<\/main>/i)?.[1]||"");
const title=s=>normalize(s.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i)?.[1]||"");
const desc=s=>normalize(s.match(/<meta\b[^>]*name=["']description["'][^>]*>/i)?.[0]||"");
const noScopes=s=>s.replace(/\sdata-astro-cid-[a-z0-9]+(?:="")?(?=\s|>)/gi,"");
const noScripts=s=>s.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,"").replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi,"");
const visible=s=>normalize(noScripts(s).replace(/<[^>]*>/g," "));
const h=s=>createHash("sha256").update(s).digest("hex");
const read=(dir,url)=>readFileSync(join(dir,new URL(url).pathname.slice(1),"index.html"),"utf8");
const counts={oldPages:oldUrls.size,newPages:newUrls.length,ledgerPages:Object.keys(ledger).length,oldMatchesLedger:0,oldDiffersLedger:0,currentDiffersLedger:0,added:0,removed:0,paired:0,changedDigest:0,changedMain:0,changedTitle:0,changedDescription:0,changedVisibleText:0,changedMainAfterScopeRemoval:0,changedMainAfterScriptAndScopeRemoval:0};
const groups={},examples={};
for(const url of newUrls){
  const after=read(newDist,url), afterHash=significantContentDigest(after,url);
  if(!ledger[url]||afterHash!==ledger[url].digest) counts.currentDiffersLedger++;
  if(!oldUrls.has(url)){counts.added++;continue;}
  counts.paired++;
  const before=read(oldDist,url), beforeHash=significantContentDigest(before,url);
  const baselineMatches=ledger[url]?.digest===beforeHash;
  counts[baselineMatches?"oldMatchesLedger":"oldDiffersLedger"]++;
  if(beforeHash===afterHash)continue;
  counts.changedDigest++;
  const b=main(before),a=main(after);
  const differences={main:b!==a,title:title(before)!==title(after),description:desc(before)!==desc(after),visibleText:visible(b)!==visible(a),mainAfterScopeRemoval:noScopes(b)!==noScopes(a),mainAfterScriptAndScopeRemoval:noScopes(noScripts(b))!==noScopes(noScripts(a))};
  for(const [k,v] of Object.entries(differences))if(v)counts["changed"+k[0].toUpperCase()+k.slice(1)]++;
  const path=new URL(url).pathname;
  const locale=path.split("/")[1];const lang=["tr","zh","hi","pt-br","fr","de","ru","ja","es"].includes(locale)?locale:"en";
  const model=/\/tractors\/[a-z0-9-]+\/$/.test(path);
  const group=(model?"model":"other")+":"+JSON.stringify(differences);
  groups[group]=(groups[group]||0)+1;
  if(!examples[group]){
    let i=0;while(i<Math.min(a.length,b.length)&&a[i]===b[i])i++;
    examples[group]={path,lang,baselineMatches,firstMainDifference:{offset:i,before:b.slice(Math.max(0,i-65),i+130),after:a.slice(Math.max(0,i-65),i+130)},beforeTitle:title(before),afterTitle:title(after),beforeDescription:desc(before),afterDescription:desc(after),beforeVisibleHash:h(visible(b)),afterVisibleHash:h(visible(a))};
  }
}
counts.removed=[...oldUrls].filter(u=>!newUrls.includes(u)).length;
console.log("SITEMAP_DIGEST_COUNTS "+JSON.stringify(counts));
console.log("SITEMAP_DIGEST_GROUPS "+JSON.stringify(groups));
console.log("SITEMAP_DIGEST_EXAMPLES "+JSON.stringify(examples));
if(!counts.paired||!counts.changedDigest)throw Error("Diagnostic did not reproduce any paired changes");
