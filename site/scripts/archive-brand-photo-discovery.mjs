/** Bulk archive research; brand-level Commons searches avoid 405 API requests.
 * All results are candidates only. They NEVER publish to TractorVS.
 */
import {readFile,writeFile} from "node:fs/promises";
const rows=JSON.parse(await readFile("photo-discovery-report/archived-tractor-models.json","utf8"));
const norm=s=>String(s||"").normalize("NFKD").replace(/[\u0300-\u036f]/g,"")
  .toLowerCase().replace(/\u0131/g,"i").replace(/[^a-z0-9]+/g,"");
const strip=s=>String(s||"").replace(/<[^>]*>/g," ").replace(/&amp;/g,"&").trim();
const wait=n=>new Promise(ok=>setTimeout(ok,n));
const aliases={
  "Başak Traktör":["Başak","Basak"],"LS Tractor":["LS Tractor","LS"],
  "Deutz-Fahr":["Deutz-Fahr"],"Tümosan":["Tümosan","Tumosan"],
  "Lamborghini Trattori":["Lamborghini"]
};
const legal=(label,url)=>{
  const name=String(label||"").toLowerCase();
  return (/(^| )cc by(?:-sa)?(?: |$)|cc0|public domain/i.test(name)||
    /creativecommons\.org\/(?:licenses\/by(?:-sa)?\/|publicdomain\/zero\/)/.test(String(url||"")))
    && !/noncommercial|no derivatives|cc-by-nc|cc-by-nd/.test(name);
};
async function query(params){
  const url=new URL("https://commons.wikimedia.org/w/api.php");
  url.searchParams.set("action","query");
  url.searchParams.set("format","json");
  url.searchParams.set("formatversion","2");
  for(const [k,v] of Object.entries(params))url.searchParams.set(k,String(v));
  let last;
  for(let i=0;i<4;i++){
    await wait(i?i*3000:1450);
    try{
      const response=await fetch(url,{
        headers:{"User-Agent":"TractorVS rights-cleared photo inventory (https://tractorvs.com/)","Accept":"application/json"},
        signal:AbortSignal.timeout(30000)
      });
      if(!response.ok)throw Error("Commons HTTP "+response.status);
      return await response.json();
    }catch(e){last=e;}
  }
  throw last;
}
const unique=new Map();
for(const r of rows){
  const key=norm(r.brand)+"|"+norm(r.model);
  if(!unique.has(key))unique.set(key,{brand:r.brand,model:r.model});
}
const byBrand=new Map();
for(const r of unique.values()){
  if(!byBrand.has(r.brand))byBrand.set(r.brand,[]);
  byBrand.get(r.brand).push(r);
}
function matched(title,brand,model){
  const name=norm(title.replace(/^File:/i,""));
  const brandNames=aliases[brand]||[brand];
  if(!brandNames.some(x=>name.includes(norm(x))))return false;
  const models=[model,...model.split(/\s*\|\s*/)].map(norm);
  return models.some(x=>x.length>=3&&name.includes(x));
}
const results=[],errors=[];
for(const [brand,models] of byBrand){
  const fileTitles=new Set();
  for(const term of aliases[brand]||[brand]){
    try{
      const data=await query({list:"search",srsearch:"intitle:"+term,srnamespace:6,srlimit:500});
      for(const item of data.query?.search||[])
        if(item.title?.startsWith("File:"))fileTitles.add(item.title);
    }catch(e){errors.push({brand,stage:"search",error:String(e)});}
  }
  const titles=[...fileTitles].filter(t=>models.some(m=>matched(t,brand,m.model))).slice(0,90);
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
        if(!legal(license,licenseUrl)||!author||!info.url)continue;
        media.push({fileTitle:item.title,photo:info.url,thumbnail:info.thumburl,
          page:info.descriptionurl,photographer:author.slice(0,180),
          license,licenseUrl,width:info.width,height:info.height});
      }
    }catch(e){errors.push({brand,stage:"metadata",error:String(e)});}
  }
  let coverage=0;
  for(const model of models){
    const photos=media.filter(v=>matched(v.fileTitle,brand,model.model)).slice(0,6);
    if(photos.length)coverage++;
    results.push({...model,photos});
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
console.log("ARCHIVE_IMAGE_DISCOVERY_SUMMARY "+JSON.stringify({
  brands:byBrand.size,uniqueModels:results.length,
  modelsWithLicensedTitleCandidates:covered,errors:errors.length
}));
