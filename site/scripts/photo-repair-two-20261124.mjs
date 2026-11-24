import {mkdir,writeFile} from "node:fs/promises";
import {createHash} from "node:crypto";
import {fetchCommonsJson} from "./photo-commons-http.mjs";
import {allowedPhotoReuseLicense} from "./photo-license-check.mjs";
const rows=[
 {id:"mccormick-x5-120-marcelx42-2023",title:"File:McCormick X5.120 P3-Drive Agritechnica 2023 (DSC03865).jpg",path:"6/66/McCormick_X5.120_P3-Drive_Agritechnica_2023_%28DSC03865%29.jpg",width:7008,height:3944},
 {id:"steyr-6440-cervus-cvt-2025",title:"File:Steyr 6440 Cervus CVT Agritechnica 2025 (DSC04360).jpg",path:"2/23/Steyr_6440_Cervus_CVT_Agritechnica_2025_%28DSC04360%29.jpg",width:6164,height:4627}
];
const dir="photo-repair-evidence";await mkdir(dir,{recursive:true});
const report={publicationCount:0,entries:[],errors:[]};const hash=(b,a)=>createHash(a).update(b).digest("hex");
try {
 const url=new URL("https://commons.wikimedia.org/w/api.php");
 for(const [k,v] of Object.entries({action:"query",format:"json",formatversion:"2",maxlag:"5",titles:rows.map(x=>x.title).join("|"),prop:"imageinfo",iiprop:"url|size|mime|sha1|extmetadata"}))url.searchParams.set(k,v);
 const data=await fetchCommonsJson(url,{maxAttempts:1});
 for(const row of rows){
  try{
   const info=data.query?.pages?.find(p=>p.title===row.title)?.imageinfo?.[0],m=info?.extmetadata;
   if(!info||info.mime!=="image/jpeg"||info.width!==row.width||info.height!==row.height||!info.sha1||!Number.isSafeInteger(info.size)||info.size<1||info.size>25*1024*1024)throw Error("Metadata mismatch");
   if(m?.LicenseShortName?.value!=="CC BY-SA 4.0"||!allowedPhotoReuseLicense(m.LicenseShortName.value,m.LicenseUrl?.value)||!m.Artist?.value?.includes("MarcelX42"))throw Error("Rights mismatch");
   const u=new URL(info.url);if(u.protocol!=="https:"||u.hostname!=="upload.wikimedia.org"||u.username||u.password||u.port||decodeURIComponent(u.pathname)!==decodeURIComponent("/wikipedia/commons/"+row.path))throw Error("Source URL mismatch");
   await new Promise(r=>setTimeout(r,1500));
   const res=await fetch(u,{redirect:"error",signal:AbortSignal.timeout(45000),headers:{"User-Agent":"TractorVS/1.0 (https://tractorvs.com/; public photo repair)","Accept":"image/jpeg"}});
   if(res.status===429||res.status===503){report.errors.push({id:row.id,error:"Provider cooldown "+res.status+" Retry-After "+(res.headers.get("retry-after")||"unspecified")});break;}
   if(!res.ok||!/^image\/jpeg\b/i.test(res.headers.get("content-type")||""))throw Error("HTTP/MIME "+res.status);
   const b=Buffer.from(await res.arrayBuffer());if(b.length!==info.size||hash(b,"sha1")!==info.sha1||b[0]!==255||b[1]!==216)throw Error("Original bytes mismatch");
   const file=row.id+"-original.jpg";await writeFile(dir+"/"+file,b);report.entries.push({...row,metadata:info,file,sha256:hash(b,"sha256")});
  }catch(e){report.errors.push({id:row.id,error:String(e)})}
 }
}catch(e){report.errors.push({error:String(e)})}
await writeFile(dir+"/report.json",JSON.stringify(report,null,2)+"\n");console.log("PHOTO_REPAIR_DOWNLOAD "+JSON.stringify({downloaded:report.entries.length,errors:report.errors}));if(report.errors.length)process.exitCode=1;
