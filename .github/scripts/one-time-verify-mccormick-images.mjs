/** Isolated one-time Wikimedia Commons provenance and exact-model JPEG importer.
 * No credentials, Supabase mutations, model publishing, or app analytics.
 * Only approved files with correct author/license/model/real JPEG may enter branch.
 * This script/workflow are REMOVED before the final reviewed PR.
 */
import {writeFile,mkdir} from "node:fs/promises";
import {createHash} from "node:crypto";

const candidates=[
 {brand:"McCormick",model:"X4.080",id:"mccormick-x4-080-mbone-agritechnica-2023",
  title:"McCormick X4.080, Agritechnica 2023, Hanover (P1140946).jpg",
  by:"MB-one",maxWidth:3400,minWidth:3000,minHeight:2400},
 {brand:"McCormick",model:"X5.085",id:"mccormick-x5-085-mbone-agritechnica-2023",
  title:null,search:"McCormick X5.085",by:"MB-one",minWidth:1300},
 {brand:"McCormick",model:"X8.631 VT-Drive",id:"mccormick-x8-631-vt-drive-marcel-2023",
  title:"McCormick X8.631 VT-Drive Agritechnica 2023 (DSC05857).jpg",
  by:"MarcelX42",minWidth:6500,minHeight:3500},
 {brand:"Belarus",model:"952.3",id:"belarus-952-3-gabinho-bucharest-2011",
  title:"Belarus 952.3 Tractor in Bucharest 2011.jpg",by:"Gabinho",
  minWidth:1200},
];
const pause=ms=>new Promise(ok=>setTimeout(ok,ms));
const norm=s=>String(s||"").normalize("NFKC").replaceAll("_"," ").toLowerCase().replace(/\s+/g," ").trim();
const clean=s=>String(s||"").replace(/<[^>]*>/g," ").replace(/&nbsp;|&amp;|&#160;/g," ").replace(/\s+/g," ").trim();
async function get(url,type="json"){
 let ex;
 for(let n=0;n<3;n++){
  try{
   const r=await fetch(url,{redirect:"manual",signal:AbortSignal.timeout(27000),headers:{
    Accept:type==="json"?"application/json":"image/jpeg",
    "User-Agent":"TractorVS/1.0 (tractorvs.com; approved Commons photo citation research)"}});
   if(!r.ok)throw Error("Wikimedia HTTP "+r.status);
   return type==="json"?await r.json():{buffer:Buffer.from(await r.arrayBuffer()),mime:r.headers.get("content-type")||""};
  }catch(e){ex=e;if(n<2)await pause(950*(n+1));}
 }
 throw ex;
}
function api(params){
 const u=new URL("https://commons.wikimedia.org/w/api.php");
 for(const [k,v] of Object.entries(params))u.searchParams.set(k,v);
 return u.toString();
}
const ii={action:"query",format:"json",formatversion:"2",prop:"imageinfo",
 iiprop:"url|size|mime|extmetadata",iiurlwidth:"500"};
async function locate(c){
 if(c.title){
  const response=await get(api({...ii,titles:"File:"+c.title}));
  const p=response.query?.pages?.find(x=>x.imageinfo?.[0]);
  if(!p||norm(p.title)!==norm("File:"+c.title))throw Error("Exact Wikimedia title unavailable");
  return p;
 }
 const response=await get(api({...ii,generator:"search",gsrsearch:c.search,gsrnamespace:"6",gsrlimit:"30"}));
 const pages=(response.query?.pages||[]).filter(x=>x.imageinfo?.[0]);
 const eligible=pages.filter(x=>{
   const title=norm(x.title);
   return title.startsWith("file:"+norm(c.brand+" "+c.model))&&
     !/x5\.085[0-9]|x5\.085\s*(hc|tm|cab)/i.test(title);
 });
 if(eligible.length!==1)throw Error("Expected one unambiguous exact model Commons file, got "+eligible.length+
   " matching titles: "+eligible.map(p=>p.title).join(" ; ").slice(0,320));
 return eligible[0];
}
const accepted=[],rejected=[];
await mkdir("site/public/images/tractors",{recursive:true});
await mkdir("site/docs",{recursive:true});
for(const c of candidates){
 try{
  const p=await locate(c),i=p.imageinfo[0],original=new URL(i.url),thumb=new URL(i.thumburl);
  if(i.mime!=="image/jpeg"||i.width<(c.minWidth||1200)||i.height<(c.minHeight||800)||
      (c.maxWidth&&i.width>c.maxWidth))throw Error("Unexpected JPEG format/dimensions");
  const m=i.extmetadata||{};
  const license=clean(m.LicenseShortName?.value||m.UsageTerms?.value||"");
  const licenseUrl=clean(m.LicenseUrl?.value||"").replace(/^http:/,"https:").replace(/\/+$/,"")+"/";
  if(!/^CC BY(?:-SA)? (?:2\.0|3\.0|4\.0)$/.test(license))throw Error("Unsupported CC license "+license);
  const match=/^CC BY(-SA)? ([234]\.0)$/.exec(license);
  const expected="https://creativecommons.org/licenses/by"+(match[1]?"-sa":"")+"/"+match[2]+"/";
  if(licenseUrl!==expected)throw Error("License URL does not match "+license);
  const artist=clean(m.Artist?.value||m.Credit?.value||"");
  if(!artist.toLowerCase().includes(c.by.toLowerCase()))throw Error("Photographer differs from independently checked source: "+artist.slice(0,140));
  if(original.hostname!=="upload.wikimedia.org"||!original.pathname.startsWith("/wikipedia/commons/"))
    throw Error("Source not a Wikimedia image");
  if(thumb.protocol!=="https:"||
    !["upload.wikimedia.org","thumb.wikimedia.org"].includes(thumb.hostname)||
    !thumb.pathname.startsWith("/wikipedia/commons/thumb/")||i.thumbwidth!==500)
    throw Error("Thumbnail not an approved 500px Wikimedia derivative");
  const photo=await get(thumb.toString(),"image");
  const b=photo.buffer;
  if(!photo.mime.toLowerCase().startsWith("image/jpeg")||b.length<9000||
      b.length>2000000||b[0]!==255||b[1]!==216||b[2]!==255||
      b.at(-2)!==255||b.at(-1)!==217)throw Error("Invalid real JPEG derivative");
  const item={
   brand:c.brand,model:c.model,fileId:c.id,
   path:original.pathname.slice("/wikipedia/commons/".length),
   photographer:c.by,license,width:i.width,height:i.height,
   fileTitle:p.title,authorMetadata:artist,licenseUrl,
   originalCommonsUrl:"https://commons.wikimedia.org/wiki/"+encodeURI(p.title.replaceAll(" ","_")),
   bytes:b.length,sha256:createHash("sha256").update(b).digest("hex"),verifiedAt:new Date().toISOString()
  };
  await writeFile("site/public/images/tractors/"+c.id+"-480.jpg",b);
  accepted.push(item);
  console.log("ACCEPTED_PHOTO "+JSON.stringify({model:c.brand+" "+c.model,id:c.id,
    artist:artist.slice(0,90),license,bytes:b.length,title:p.title}));
 }catch(e){const reason=String(e);rejected.push({brand:c.brand,model:c.model,id:c.id,reason});
  console.log("REJECTED_PHOTO "+JSON.stringify(rejected.at(-1)));}
 await pause(380);
}
await writeFile("site/docs/photo-import-evidence-mccormick-20261121.json",
 JSON.stringify({reviewed:candidates.length,approved:accepted,rejected,policy:"Exact-model Commons files only; no family/variant substitutions; Wikimedia artist/license/real JPEG evidence required"},null,2)+"\n");
if(!accepted.length)throw Error("No candidate passed the safety gate");
console.log("PHOTO_IMPORT_RESULT "+JSON.stringify({approved:accepted.length,rejected:rejected.length,models:accepted.map(x=>x.brand+" "+x.model)}));