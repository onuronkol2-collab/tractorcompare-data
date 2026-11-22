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
 {prefix:"basak-traktor-2075-bk-",markers:["3830","3930"],
  urls:["https://basaktraktor.com.tr/urunler/traktorler/tarla-traktorleri/2075-bk",
   "https://admin.basaktraktor.com.tr/upload/7c743eaf-5228-4ae7-94d7-25df6a13e778-2075%20BK%204WD.pdf"]}
];

export function auditConflictHtml(html,item){
 const banner=html.match(/<aside\b[^>]*class="model-source-conflict-banner"[\s\S]*?<\/aside>/)?.[0]||"";
 const normalized=banner.replaceAll(".","").replaceAll(",","").replaceAll(" ","");
 return Boolean(banner&&item.urls.every(url=>banner.includes('href="'+url+'"'))&&
  item.markers.every(marker=>normalized.includes(marker.replace(/[., ]/g,""))));
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
   reports.push(prefix+"tractors/"+slug);
  }
 }
 return {conflictModels:CASES.length,localePageCount:reports.length};
}

if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const dist=resolve(fileURLToPath(new URL("../dist",import.meta.url)));
 console.log("TRACTORVS_OEM_CONFLICT_QA "+JSON.stringify(verifyManufacturerConflictArtifacts(dist)));
}
