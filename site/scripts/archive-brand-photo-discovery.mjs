import {matchesPhotoFileModel} from "./photo-model-identity.mjs";
import {allowedPhotoReuseLicense} from "./photo-license-check.mjs";
import {fetchCommonsJson,CommonsCooldownError} from "./photo-commons-http.mjs";
/** Bulk archive research; brand-level Commons searches avoid 405 API requests.
 * All results are candidates only. They NEVER publish to TractorVS.
 */
import {readFile,writeFile} from "node:fs/promises";
const rows=JSON.parse(await readFile("photo-discovery-report/archived-tractor-models.json","utf8"));
const publishedRows=JSON.parse(await readFile("photo-discovery-report/published-model-inventory.json","utf8"));
if(!Array.isArray(rows)||!rows.length||!Array.isArray(publishedRows)||!publishedRows.length||
   publishedRows.some(x=>x.error||!x.brand||!x.model))
  throw Error("Cannot run Commons brand research with incomplete source/public inventories");
const norm=s=>String(s||"").normalize("NFKD").replace(/[\u0300-\u036f]/g,"")
  .toLowerCase().replace(/\u0131/g,"i").replace(/[^a-z0-9]+/g,"");
const strip=s=>String(s||"").replace(/<[^>]*>/g," ").replace(/&amp;/g,"&").trim();
const wait=n=>new Promise(ok=>setTimeout(ok,n));
const aliases={
  "Başak Traktör":["Başak","Basak"],"LS Tractor":["LS Tractor","LS"],
  "Deutz-Fahr":["Deutz-Fahr"],"Tümosan":["Tümosan","Tumosan"],
  "Lamborghini Trattori":["Lamborghini"]
};

// Once Commons asks us to stop (429/503 cooldown), do not hammer other
// brands with new requests; preserve partial reports and fail the final gate.
let commonsPaused=null;
async function query(params){
  if(commonsPaused)throw commonsPaused;
  const url=new URL("https://commons.wikimedia.org/w/api.php");
  url.searchParams.set("action","query");
  url.searchParams.set("format","json");
  url.searchParams.set("formatversion","2");
  url.searchParams.set("maxlag","5");
  for(const [k,v] of Object.entries(params))url.searchParams.set(k,String(v));
  await wait(1450);
  try{return await fetchCommonsJson(url,{sleep:wait});}
  catch(e){
    if(e instanceof CommonsCooldownError)commonsPaused=e;
    throw e;
  }
}
// Combine frozen historical identities with fresh public model identities
// before querying Commons. This preserves ALL live models without extra API
// calls for each variant. The historical 405-model report remains separate.
const key=r=>norm(r.brand)+"|"+norm(r.model);
const historical=new Map();
const publicModels=new Map();
for(const r of rows)if(r?.brand&&r?.model&&!historical.has(key(r)))
  historical.set(key(r),{brand:r.brand,model:r.model});
for(const r of publishedRows)if(!publicModels.has(key(r)))
  publicModels.set(key(r),{brand:r.brand,model:r.model});
const unique=new Map([...historical,...publicModels]);
const byBrand=new Map();
for(const r of unique.values()){
  if(!byBrand.has(r.brand))byBrand.set(r.brand,[]);
  byBrand.get(r.brand).push(r);
}

const results=[],publicResults=[],errors=[];
for(const [brand,models] of byBrand){
  const fileTitles=new Set();
  for(const term of aliases[brand]||[brand]){
    try{
      const data=await query({list:"search",srsearch:"intitle:"+term,srnamespace:6,srlimit:500});
      for(const item of data.query?.search||[])
        if(item.title?.startsWith("File:"))fileTitles.add(item.title);
    }catch(e){errors.push({brand,stage:"search",error:String(e)});}
  }
  const titles=[...fileTitles].filter(t=>models.some(m=>matchesPhotoFileModel(brand,m.model,t))).slice(0,90);
  const media=[];
  for(let i=0;i<titles.length;i+=20){
    try{
      const data=await query({titles:titles.slice(i,i+20).join("|"),
        prop:"imageinfo",iiprop:"url|size|mime|extmetadata",iiurlwidth:960});
      for(const item of data.query?.pages||[]){
        const info=item.imageinfo?.[0];
        if(!info||info.mime!=="image/jpeg")continue;
        const meta=info.extmetadata||{};
        const text=k=>strip(meta[k]?.value);
        const license=text("LicenseShortName")||text("UsageTerms");
        const licenseUrl=text("LicenseUrl");
        const author=text("Artist")||text("Credit");
        if(!allowedPhotoReuseLicense(license,licenseUrl)||!author||!info.url)continue;
        media.push({fileTitle:item.title,photo:info.url,thumbnail:info.thumburl,
          page:info.descriptionurl,photographer:author.slice(0,180),
          license,licenseUrl,width:info.width,height:info.height});
      }
    }catch(e){errors.push({brand,stage:"metadata",error:String(e)});}
  }
  let coverage=0;
  for(const model of models){
    const photos=media.filter(v=>matchesPhotoFileModel(brand,model.model,v.fileTitle)).slice(0,6);
    if(photos.length)coverage++;
    if(historical.has(key(model)))results.push({...historical.get(key(model)),photos});
    if(publicModels.has(key(model)))publicResults.push({...publicModels.get(key(model)),photos});
  }
  console.log("ARCHIVE_BRAND_DISCOVERY "+JSON.stringify({
    brand,models:models.length,matchingFileTitles:titles.length,
    licensedPhotos:media.length,modelsWithCandidates:coverage
  }));
}
const covered=results.filter(x=>x.photos.length).length;
const report={snapshotDate:"2026-11-14",modelCount:results.length,
  matchedModelCount:covered,errorCount:errors.length,errors,
  warning:"Candidates only. No photographer has endorsed TractorVS; no draft is published.",
  models:results};
await writeFile("photo-discovery-report/archived-image-candidates.json",JSON.stringify(report,null,2));
await writeFile("photo-discovery-report/public-image-candidates.json",JSON.stringify({
  inventorySource:"live verified published sitemap, same-run Wikimedia brand queries",
  modelCount:publicResults.length,errorCount:errors.length,errors,
  warning:"Non-exhaustive title-based discovery; photos require identity and rights review before any publication.",
  models:publicResults
},null,2));
console.log("ARCHIVE_IMAGE_DISCOVERY_SUMMARY "+JSON.stringify({
  brands:byBrand.size,uniqueModels:results.length,
  publicUniqueModels:publicResults.length,publicModelsWithCandidates:publicResults.filter(x=>x.photos.length).length,
  modelsWithLicensedTitleCandidates:covered,errors:errors.length
}));
// Preserve the report for diagnosis, but incomplete research is never success.
if(errors.length)process.exitCode=1;
