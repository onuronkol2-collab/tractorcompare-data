import {writeFile,mkdir} from "node:fs/promises";
import {createHash} from "node:crypto";
// This file is a one-time source-validation helper on a feature branch.
// Remove script and workflow before merging, with only reviewed binaries
// and their provenance surviving.
const records=[
 {brand:"Steyr",model:"4085 KOMPAKT",fileId:"steyr-4085-kompakt-ecotech-commons",file:"Steyr 4085 Kompakti Ecotech.jpg",width:4000,height:3200,match:"4085"},
 {brand:"Steyr",model:"6240 ABSOLUT CVT",fileId:"steyr-6240-absolut-blonder1984",file:"Steyr Absolut 6240.jpg",width:4608,height:3456,match:"6240"},
 {brand:"Steyr",model:"6340 TERRUS CVT",fileId:"steyr-6340-terrus-marcel-2023",file:"Steyr 6340 Terrus CVT Agritechnica 2023 (DSC04861).jpg",width:7008,height:3944,match:"6340"},
];
const plain=s=>String(s||"").replace(/<[^>]*>/g," ").replace(/&amp;|&#160;|&nbsp;/g," ").replace(/\s+/g," ").trim();
const sleep=ms=>new Promise(ok=>setTimeout(ok,ms));
async function fetchChecked(url,json=false){
 let error;
 for(let attempt=0;attempt<3;attempt++){
  try{
   const r=await fetch(url,{redirect:"manual",signal:AbortSignal.timeout(28000),
    headers:{Accept:json?"application/json":"image/jpeg",
     "User-Agent":"TractorVS/1.0 (tractorvs.com; verified Wikimedia photo source research)"}});
   if(!r.ok)throw Error("HTTP "+r.status);
   return json?await r.json():{buffer:Buffer.from(await r.arrayBuffer()),mime:r.headers.get("content-type")||""};
  }catch(e){error=e;if(attempt<2)await sleep(1100*(attempt+1));}
 }
 throw error;
}
await mkdir("site/public/images/tractors",{recursive:true});
await mkdir("site/docs",{recursive:true});
const accepted=[],rejected=[];
for(const c of records){
 try{
  const api=new URL("https://commons.wikimedia.org/w/api.php");
  for(const [k,v] of Object.entries({action:"query",format:"json",formatversion:"2",
   titles:"File:"+c.file,prop:"imageinfo",iiprop:"url|size|mime|extmetadata",
   iiurlwidth:"500"}))api.searchParams.set(k,v);
  const json=await fetchChecked(api.toString(),true);
  const p=json.query?.pages?.find(p=>p.imageinfo?.[0]);
  if(!p||p.title.toLowerCase()!==("File:"+c.file).toLowerCase())
    throw Error("Wikimedia exact file name not found "+c.file);
  const i=p.imageinfo[0],m=i.extmetadata||{};
  if(i.mime!=="image/jpeg"||i.width!==c.width||i.height!==c.height)
    throw Error("Original dimensions or format do not match the reviewed file");
  if(!p.title.toLowerCase().includes("steyr")||
    !p.title.includes(c.match))throw Error("Wrong tractor brand/model in the photo title");
  const name=plain(m.LicenseShortName?.value||m.UsageTerms?.value||"");
  const legal=plain(m.LicenseUrl?.value||"").replace(/^http:/,"https:").replace(/\/+$/,"")+"/";
  if(!["CC BY-SA 4.0","CC BY 4.0"].includes(name))
    throw Error("Not a supported Creative Commons license "+name);
  const expected=name==="CC BY-SA 4.0"?"https://creativecommons.org/licenses/by-sa/4.0/":
    "https://creativecommons.org/licenses/by/4.0/";
  if(legal!==expected)throw Error("License URL mismatch "+legal);
  const photographer=plain(m.Artist?.value||m.Credit?.value||"");
  if(photographer.length<3||photographer.length>150||/unknown|anonymous|wikimedia commons/i.test(photographer))
    throw Error("Unknown photographer identity: "+photographer);
  const orig=new URL(i.url),thumb=new URL(i.thumburl);
  if(orig.hostname!=="upload.wikimedia.org"||
    !orig.pathname.startsWith("/wikipedia/commons/")||
    !["upload.wikimedia.org","thumb.wikimedia.org"].includes(thumb.hostname)||
    !thumb.pathname.startsWith("/wikipedia/commons/thumb/")||
    i.thumbwidth!==500)
     throw Error("Unexpected Wikimedia host, source path or thumbnail size");
  const image=await fetchChecked(thumb.toString());
  const b=image.buffer;
  if(!image.mime.startsWith("image/jpeg")||b.length<9000||b.length>2500000||
    b[0]!==255||b[1]!==216||b[2]!==255||b.at(-2)!==255||b.at(-1)!==217)
    throw Error("Not a valid small JPEG");
  const item={
    brand:c.brand,model:c.model,fileId:c.fileId,
    path:orig.pathname.slice("/wikipedia/commons/".length),
    photographer,license:name,width:i.width,height:i.height,
    sourcePage:"https://commons.wikimedia.org/wiki/"+encodeURI(p.title.replaceAll(" ","_")),
    licenseUrl:legal,originalFilename:c.file,bytes:b.length,
    sha256:createHash("sha256").update(b).digest("hex"),
    checkedAt:new Date().toISOString()
  };
  accepted.push(item);
  await writeFile("site/public/images/tractors/"+c.fileId+"-480.jpg",b);
  console.log("ACCEPTED "+JSON.stringify({model:c.model,author:photographer,license:name,
   path:item.path,bytes:b.length}));
 }catch(e){
  const rejectedItem={model:c.model,file:c.file,error:String(e)};
  rejected.push(rejectedItem);console.log("REJECTED "+JSON.stringify(rejectedItem));
 }
 await sleep(300);
}
await writeFile("site/docs/steyr-photo-source-audit-20261121.json",
 JSON.stringify({approved:accepted,rejected,notes:"Third-party images; exact source, author, image/jpeg and CC license. Never infer pictured configuration."},null,2)+"\n");
if(!accepted.length)throw Error("No image can be published without verified evidence");
console.log("PHOTO_SOURCE_SUMMARY "+JSON.stringify({approved:accepted.length,rejected:rejected.length}));
