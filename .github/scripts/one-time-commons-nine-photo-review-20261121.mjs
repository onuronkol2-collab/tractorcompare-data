/**
 * One-time, conservative Commons photo evidence verification and JPEG acquisition.
 * Runs ONLY in a short-lived GitHub feature branch. Deleted before PR merge.
 * It cannot publish site pages, touch Supabase, or modify auth/analytics.
 */
import {mkdir,writeFile} from "node:fs/promises";
import {createHash} from "node:crypto";
import {matchesPhotoFileModel} from "../../site/scripts/photo-model-identity.mjs";

const records=[
 {brand:"Belarus",model:"922.3",fileId:"belarus-922-3-bulykin-almaty-2026",
  filename:"Алматы, Беларус-922.3 на Кулымбетова-Бруно (1).jpg",
  photographer:"Nikolai Bulykin",authorHint:"Bulykin",license:"CC BY-SA 4.0",
  width:5077,height:3385},
 {brand:"Steyr",model:"4075 KOMPAKT",fileId:"steyr-4075-kompakt-joachim-2018",
  filename:"Steyr 4075 Kompakt.jpg",photographer:"JoachimKohlerBremen",
  authorHint:"JoachimKohler",license:"CC BY-SA 4.0",width:4200,height:2800},
 {brand:"Steyr",model:"4095 KOMPAKT",fileId:"steyr-4095-kompakt-joachim-2019",
  filename:"Steyr 4095 Kompakt mit Kuhn BRP28 Mulch- und Häckselgerät.jpg",
  photographer:"JoachimKohler-HB",authorHint:"JoachimKohler",license:"CC BY-SA 4.0",
  width:4200,height:3150},
 {brand:"Steyr",model:"4105 KOMPAKT",fileId:"steyr-4105-kompakt-gt1976-2018",
  filename:"2018-06-28 (801) Steyr 4105 Kompakt in Kirchberg an der Pielach.jpg",
  photographer:"GT1976",authorHint:"GT1976",license:"CC BY-SA 4.0",
  width:4000,height:3000},
 {brand:"Steyr",model:"4115 KOMPAKT",fileId:"steyr-4115-kompakt-joachim-2019",
  filename:"Steyr Kompakt 4115.jpg",photographer:"JoachimKohler-HB",
  authorHint:"JoachimKohler",license:"CC BY-SA 4.0",width:4200,height:3150},
 {brand:"Steyr",model:"4130 EXPERT CVT",fileId:"steyr-4130-expert-cvt-marcel-2024",
  filename:"Steyr 4130 Expert CVT agra 2024 (DSC01621).jpg",
  photographer:"MarcelX42",authorHint:"MarcelX42",license:"CC BY-SA 4.0",
  width:6642,height:3738},
 {brand:"Steyr",model:"4140 EXPERT CVT",fileId:"steyr-4140-expert-cvt-marcel-2023",
  filename:"Steyr 4140 Expert CVT Agritechnica 2023 (DSC05407).jpg",
  photographer:"MarcelX42",authorHint:"MarcelX42",license:"CC BY-SA 4.0",
  width:7008,height:3944},
 {brand:"Steyr",model:"6280 ABSOLUT CVT",fileId:"steyr-6280-absolut-cvt-marcel-2024",
  filename:"Steyr 6280 Absolut CVT agra 2024 (DSC02603).jpg",
  photographer:"MarcelX42",authorHint:"MarcelX42",license:"CC BY-SA 4.0",
  width:7008,height:3944},
 {brand:"Zetor",model:"6170",fileId:"zetor-6170-marcel-agritechnica-2025",
  filename:"Zetor 6170 Agritechnica 2025 (DSC05468).jpg",
  photographer:"MarcelX42",authorHint:"MarcelX42",license:"CC BY-SA 4.0",
  width:5974,height:4480}
];

const pause=(ms)=>new Promise(ok=>setTimeout(ok,ms));
const strip=(v)=>String(v||"").replace(/<[^>]+>/g," ")
 .replace(/&(?:nbsp|amp);|&#160;/g," ").replace(/\s+/g," ").trim();
const fold=s=>String(s||"").normalize("NFKC").replaceAll("_"," ").replace(/\s+/g," ")
 .trim().toLowerCase();
async function get(url,json=false){
 let error;
 for(let n=0;n<3;n++){
  try{
   const res=await fetch(url,{redirect:"manual",signal:AbortSignal.timeout(25000),
    headers:{"User-Agent":"TractorVS/1.0 (tractorvs.com licensed model photography research)",
     Accept:json?"application/json":"image/jpeg"}});
   if(!res.ok)throw Error("Wikimedia HTTP "+res.status);
   return json?await res.json():{mime:res.headers.get("content-type")||"",body:Buffer.from(await res.arrayBuffer())};
  }catch(e){error=e;if(n<2)await pause(900*(n+1));}
 }
 throw error;
}
function endpoint(args){
 const u=new URL("https://commons.wikimedia.org/w/api.php");
 Object.entries(args).forEach(([k,v])=>u.searchParams.set(k,v));
 return u.toString();
}
const props={action:"query",format:"json",formatversion:"2",prop:"imageinfo",
  iiprop:"url|size|mime|extmetadata",iiurlwidth:"500"};
async function findPage(record){
 const title="File:"+record.filename;
 let data=await get(endpoint({...props,titles:title}),true);
 let page=data.query?.pages?.find(p=>p.imageinfo?.[0]);
 if(!page){
  // A known non-ASCII file was not found via titles in earlier tests.
  // Search is a DISCOVERY fallback; accept only a title IDENTICAL to the
  // pre-reviewed filename, never a merely similar model or year.
  data=await get(endpoint({...props,generator:"search",gsrsearch:record.brand==="Belarus"?
    "Беларус-922.3 Кулымбетова":record.brand+" "+record.model,
    gsrnamespace:"6",gsrlimit:"30"}),true);
  page=data.query?.pages?.find(p=>p.imageinfo?.[0]&&
    fold(p.title)===fold(title));
 }
 if(!page)throw Error("Exact Wikimedia title not found: "+record.fileId);
 return page;
}
function licenseCheck(record,meta){
 const name=strip(meta.LicenseShortName?.value||meta.UsageTerms?.value||"");
 const link=strip(meta.LicenseUrl?.value||"").replace(/^http:/,"https:").replace(/\/+$/,"");
 const expected="https://creativecommons.org/licenses/by-sa/4.0";
 if(name!==record.license||link!==expected)
  throw Error("Unapproved license: "+record.fileId+": "+name+" "+link);
 const artist=strip(meta.Artist?.value||meta.Credit?.value||"");
 if(!artist.toLowerCase().includes(record.authorHint.toLowerCase()))
  throw Error("Artist mismatch: "+record.fileId+"; artist "+artist.slice(0,145));
 return artist;
}
const output="site/public/images/tractors";
await mkdir(output,{recursive:true});
await mkdir("site/docs",{recursive:true});
const successes=[],failures=[];
for(const record of records){
 try{
  const p=await findPage(record);
  // Steyr official naming is "4115 KOMPAKT", while this vetted Commons
  // file has the inverse word order "Kompakt 4115". This ONE literal
  // model exception is documented and cannot match another version.
  const inverseSteyr=record.brand==="Steyr" && record.model==="4115 KOMPAKT" &&
    p.title==="File:Steyr Kompakt 4115.jpg";
  const exactModel=inverseSteyr || (record.brand==="Belarus"&&record.model==="922.3"
   ? p.title.includes("Беларус-922.3")
   : matchesPhotoFileModel(record.brand,record.model,p.title));
  if(!exactModel)throw Error("Title not an exact model: "+record.fileId);
  const i=p.imageinfo?.[0];
  if(!i||i.mime!=="image/jpeg"||i.width!==record.width||i.height!==record.height)
   throw Error("MIME or source dimensions mismatch: "+record.fileId);
  const artist=licenseCheck(record,i.extmetadata||{});
  const thumb=new URL(i.thumburl);
  if(thumb.protocol!=="https:"||
   !["thumb.wikimedia.org","upload.wikimedia.org"].includes(thumb.hostname)||
   !thumb.pathname.startsWith("/wikipedia/commons/thumb/"))
    throw Error("Unapproved Wikimedia image host/path: "+record.fileId);
  if(i.thumbwidth!==500)throw Error("Unexpected thumbnail size "+record.fileId+": "+i.thumbwidth);
  const {body,mime}=await get(thumb.toString());
  if(!mime.toLowerCase().startsWith("image/jpeg")||body.length<9000||body.length>2500000||
   body[0]!==255||body[1]!==216||body[2]!==255||body.at(-2)!==255||body.at(-1)!==217)
   throw Error("JPEG integrity/size validation failed: "+record.fileId);
  const sha256=createHash("sha256").update(body).digest("hex");
  await writeFile(output+"/"+record.fileId+"-480.jpg",body);
  const original=new URL(i.url);
  if(original.hostname!=="upload.wikimedia.org"||
    !/^\/wikipedia\/commons\/[0-9a-f]\/\w{2}\//.test(original.pathname))
    throw Error("Unapproved origin image path: "+record.fileId);
  const f={...record,fileTitle:p.title,sourcePage:"https://commons.wikimedia.org/wiki/"+
    encodeURI(p.title.replaceAll(" ","_")),commonsPath:original.pathname.slice("/wikipedia/commons/".length),
    bytes:body.length,sha256,artistVerified:artist,
    verifiedAt:new Date().toISOString()};
  successes.push(f);
  console.log("PHOTO_VERIFIED "+JSON.stringify({id:record.fileId,model:record.brand+" "+record.model,
   bytes:body.length,sha256,license:record.license,photographer:record.photographer}));
 }catch(e){
  failures.push({fileId:record.fileId,brand:record.brand,model:record.model,error:String(e)});
  console.log("PHOTO_REJECTED "+JSON.stringify(failures.at(-1)));
 }
 await pause(350);
}
await writeFile("site/docs/photo-review-evidence-20261121.json",JSON.stringify({
 purpose:"one-time verified third-party tractor photographs",
 rules:"Only exact source, verified authors, CC BY-SA 4.0, source dimensions and real JPEGs",
 approved:successes,rejected:failures
},null,2)+"\n");
if(!successes.length)throw Error("No valid photos, no binary commit");
console.log("PHOTO_BATCH_SUMMARY "+JSON.stringify({reviewed:records.length,approved:successes.length,
 rejected:failures.length,ids:successes.map(x=>x.fileId)}));