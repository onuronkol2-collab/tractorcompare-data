/**
 * ONE-TIME, review-only branch bootstrap. No database, publishing API or
 * user content access. Download only a fixed list of Wikimedia thumbnails.
 * Delete this script and its one-time workflow before merging the PR.
 */
import {mkdir,writeFile} from "node:fs/promises";
import {join} from "node:path";
import {createHash} from "node:crypto";
const records=[
  {filename:"Tractor_arando_la_tierra_para_cultivo.jpg",id:"belarus-892-ivan2010-2013",
    artist:"Ivan2010",license:"CC BY-SA 4.0",width:2654,height:1880},
  {filename:"Belarus_892.2,_2025_Dunapataj.jpg",id:"belarus-892-2-globetrotter19-2025",
    artist:"Globetrotter19",license:"CC BY-SA 4.0",width:2592,height:1944},
  {filename:"Алматы,_Беларус-922.3_на_Кулымбетова-Бруно_(1).jpg",id:"belarus-922-3-bulykin-almaty-2026",
    artist:"Nikolai Bulykin",license:"CC BY-SA 4.0",width:5077,height:3385},
  {filename:"Belarus_952.jpg",id:"belarus-952-fraxinus-croat-2011",
    artist:"Fraxinus Croat",license:"CC BY-SA 3.0",width:2048,height:1536},
];
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
async function get(url,json=false){
  let last;
  for(let i=0;i<3;i++){
    try{
      const r=await fetch(url,{
        signal:AbortSignal.timeout(30000),
        headers:{"User-Agent":"TractorVS/1.0 (tractorvs.com; license-audited Commons thumbnail research)","Accept":json?"application/json":"image/jpeg"},
      });
      if(!r.ok)throw Error("HTTP "+r.status+" while fetching Wikimedia "+new URL(url).hostname);
      return json?await r.json():{body:Buffer.from(await r.arrayBuffer()),mime:r.headers.get("content-type")||""};
    }catch(e){last=e;if(i<2)await sleep(1200*(i+1))}
  }
  throw last;
}
const strip=s=>String(s||"").replace(/<[^>]+>/g," ").replace(/&amp;/g,"&")
  .replace(/&nbsp;/g," ").replace(/\s+/g," ").trim();
function licenceAllowed(meta,record){
  const name=strip(meta.LicenseShortName?.value || meta.UsageTerms?.value || "");
  const url=strip(meta.LicenseUrl?.value || "");
  const expected="https://creativecommons.org/licenses/by-sa/"+record.license.slice(-3)+"/";
  if(name!==record.license||url.replace(/^http:/,"https:")!==expected)
    throw Error("Licence mismatch: "+record.id+" "+name+" "+url);
  const artist=strip(meta.Artist?.value||meta.Credit?.value||"");
  if(!artist.toLowerCase().includes(record.artist.toLowerCase()))
    throw Error("Photographer mismatch: "+record.id+" expected "+record.artist+" got "+artist);
}
const destination="site/public/images/tractors";
await mkdir(destination,{recursive:true});
for(const record of records){
  const fileTitle="File:"+record.filename.replaceAll("_"," ");
  const api=new URL("https://commons.wikimedia.org/w/api.php");
  for(const [k,v] of Object.entries({action:"query",format:"json",formatversion:"2",
    titles:fileTitle,prop:"imageinfo",iiprop:"url|size|mime|extmetadata",iiurlwidth:"500"}))
    api.searchParams.set(k,v);
  const result=await get(api.toString(),true);
  const p=result.query?.pages?.[0],info=p?.imageinfo?.[0]||null;
  if(!info||p.missing||p.invalid)throw Error("Wikimedia file missing: "+record.id);
  if(info.mime!=="image/jpeg"||info.width!==record.width||info.height!==record.height)
    throw Error("Wikimedia dimensions/mime mismatch "+record.id);
  licenceAllowed(info.extmetadata||{},record);
  const thumb=info.thumburl;
  if(typeof thumb!=="string"||!thumb.startsWith("https://upload.wikimedia.org/wikipedia/commons/thumb/"))
    throw Error("Unapproved thumb host "+record.id);
  if(info.thumbwidth!==500)throw Error("Thumbnail not 500px: "+record.id+": "+info.thumbwidth);
  const {body,mime}=await get(thumb);
  if(!/^image\/jpeg/i.test(mime)||body.length<9000||body.length>2500000||
    body[0]!==255||body[1]!==216||body[2]!==255||
    body.at(-2)!==255||body.at(-1)!==217)
    throw Error("Invalid/oversized JPEG "+record.id+": "+mime+" "+body.length);
  await writeFile(join(destination,record.id+"-480.jpg"),body);
  console.log("VERIFIED_PHOTO "+JSON.stringify({file:record.id,bytes:body.length,
    width:500,sha256:createHash("sha256").update(body).digest("hex"),
    license:record.license,artist:record.artist,source:"https://commons.wikimedia.org/wiki/File:"+encodeURIComponent(record.filename)}));
  await sleep(250);
}
console.log("PHOTO_BATCH_OK count="+records.length);
