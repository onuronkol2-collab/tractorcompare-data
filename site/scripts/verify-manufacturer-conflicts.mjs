/**
 * Postflight: verify all ten public TractorVS locales plainly disclose
 * unresolved official manufacturer contradictions.
 * This checks built pages only; never fetches unpublished/private data.
 */
import {readdirSync,readFileSync,existsSync} from "node:fs";
import {resolve,join} from "node:path";
import {fileURLToPath} from "node:url";

const LOCALES=["","tr/","zh/","hi/","pt-br/","fr/","de/","ru/","ja/","es/"];
const CASES=[
 {prefix:"antonio-carraro-tigre-3800-f-",markers:["1331","1642"],
  urls:["https://www.antoniocarraro.it/it/catalogo/tigre-3800-f",
   "https://www.antoniocarraro.it/en/catalogue/tigre-3800-f"]},
 {prefix:"antonio-carraro-mach-2-r-",markers:["74","98"],
  urls:["https://www.antoniocarraro.it/en/catalogue/mach-2-r"]},
 {prefix:"sonalika-gt-22-4wd-",markers:["4WD","2WD"],
  urls:["https://www.sonalika.com/tractor/gt-22-4wd"]},
 {prefix:"basak-traktor-2075-bk-9ef236be",markers:["3830","3930"],
  urls:["https://basaktraktor.com.tr/urunler/traktorler/tarla-traktorleri/2075-bk",
   "https://admin.basaktraktor.com.tr/upload/7c743eaf-5228-4ae7-94d7-25df6a13e778-2075%20BK%204WD.pdf"],
  comparisonId:"9ef236be-0d91-4c87-af3d-8c0cf33f08a1",
  disputedKeys:["overall_length","overall_length_with_front_ballast_mm"]}
];

export function auditConflictHtml(html,item){
 const banner=html.match(/<aside\b[^>]*class="model-source-conflict-banner"[\s\S]*?<\/aside>/)?.[0]||"";
 const normalized=banner.replaceAll(".","").replaceAll(",","").replaceAll(" ","");
 return Boolean(banner&&item.urls.every(url=>banner.includes('href="'+url+'"'))&&
  item.markers.every(marker=>normalized.includes(marker.replace(/[., ]/g,""))));
}

/** Fail closed on the published static comparison JSON, not just the model detail warning. */
export function auditConflictComparisonJson(rows,issue){
 if(!Array.isArray(rows)||!issue?.disputedKeys||!issue?.markers)return false;
 if(rows.some(row=>issue.disputedKeys.includes(row?.key)))return false;
 const notes=rows.map(row=>typeof row?.notice==="string"?row.notice:"").join(" ");
 const normalized=notes.replace(/[.,\s]/g,"");
 if(!issue.markers.every(marker=>normalized.includes(String(marker).replace(/[.,\s]/g,""))))return false;
 // Other independently measured dimensions still need to reach comparisons.
 return rows.some(row=>row?.key==="wheelbase"&&String(row?.value||"").trim());
}

export function verifyManufacturerConflictArtifacts(dist) {
 const reports=[];
 const enModels=join(dist,"tractors");
 const folders=readdirSync(enModels,{withFileTypes:true})
  .filter(entry=>entry.isDirectory()).map(entry=>entry.name);
 for(const issue of CASES) {
  const matches=folders.filter(name=>name.startsWith(issue.prefix));
  if(matches.length!==1)throw Error("Expected exactly one published OEM model for "+issue.prefix+"; found "+matches.length);
  const slug=matches[0];
  for(const prefix of LOCALES){
   const path=join(dist,prefix,"tractors",slug,"index.html");
   if(!existsSync(path))throw Error("Published conflict page missing: "+path);
   const html=readFileSync(path,"utf8");
   if(!auditConflictHtml(html,issue))throw Error("OEM contradiction not visible and source-linked: "+prefix+slug);
   if(issue.comparisonId){
    const locale=prefix?prefix.slice(0,-1):"en";
    const dataPath=join(dist,"comparison-data",locale,issue.comparisonId+".json");
    if(!existsSync(dataPath))throw Error("Approved model comparison feed missing: "+dataPath);
    let data;
    try{data=JSON.parse(readFileSync(dataPath,"utf8"));}
    catch{throw Error("Malformed model comparison JSON: "+dataPath);}
    if(!auditConflictComparisonJson(data,issue))throw Error("Disputed OEM lengths leaked or notice lost: "+locale);
   }
   reports.push(prefix+"tractors/"+slug);
  }
 }
 return {conflictModels:CASES.length,localePageCount:reports.length};
}

if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const dist=resolve(fileURLToPath(new URL("../dist",import.meta.url)));
 console.log("TRACTORVS_OEM_CONFLICT_QA "+JSON.stringify(verifyManufacturerConflictArtifacts(dist)));
}
