import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {fetchCommonsJson} from './photo-commons-http.mjs';
import {allowedPhotoReuseLicense} from './photo-license-check.mjs';
const hash=(b,a='sha256')=>createHash(a).update(b).digest('hex');
const dir='photo-batch-evidence';mkdirSync(dir,{recursive:true});
const titles=['File:Barzkowice - McCormick X7.621 - 12.09.2026 13-26-59.jpg','File:JCB Fastrac 6260 Agritechnica 2025 (DSC05623).jpg','File:JCB Fastrac 6300 Agritechnica 2025 (DSC00362).jpg','File:Versatile 295 Agritechnica 2025 (DSC03651).jpg','File:Versatile 460 Agritechnica 2025 (DSC00494).jpg','File:Versatile 620DT Agritechnica 2025 (DSC00990).jpg','File:Belarus 451 (open day 2017) 1.jpg','File:Belarus 510 (open day 2017) 1.jpg','File:Belarus 923.4 (open day 2017) 1.jpg','File:Swaraj 735 FE.jpg'];
const report={publicationCount:0,entries:[],errors:[]};
try{
 const u=new URL('https://commons.wikimedia.org/w/api.php');
 for(const [k,v] of Object.entries({action:'query',format:'json',formatversion:'2',maxlag:'5',titles:titles.join('|'),prop:'imageinfo',iiprop:'url|size|mime|sha1|extmetadata'}))u.searchParams.set(k,v);
 const data=await fetchCommonsJson(u,{maxAttempts:1});
 for(const [i,title] of titles.entries()){
  const row={title,visualIdentityVerified:false,approvedToPublish:false};report.entries.push(row);
  try{
   const info=data.query?.pages?.find(p=>p.title===title)?.imageinfo?.[0];row.metadata=info??null;
   if(!info||info.mime!=='image/jpeg'||!Number.isSafeInteger(info.size)||info.size<1||info.size>25*1024*1024||!info.sha1)throw Error('Original metadata missing or unsupported');
   const m=info.extmetadata||{};if(!allowedPhotoReuseLicense(m.LicenseShortName?.value,m.LicenseUrl?.value)||!m.Artist?.value)throw Error('Rights metadata incomplete');
   const url=new URL(info.url);if(url.protocol!=='https:'||url.hostname!=='upload.wikimedia.org'||!url.pathname.startsWith('/wikipedia/commons/')||url.username||url.password||url.port)throw Error('Invalid original URL');
   await new Promise(r=>setTimeout(r,1500));
   const res=await fetch(url,{redirect:'error',signal:AbortSignal.timeout(45000),headers:{'User-Agent':'TractorVS/1.0 (https://tractorvs.com/; public photo rights research)',Accept:'image/jpeg'}});
   if(res.status===429||res.status===503){report.errors.push({title,error:'Provider cooldown '+res.status+' Retry-After '+(res.headers.get('retry-after')||'unspecified')});break;}
   if(!res.ok||!/^image\/jpeg\b/i.test(res.headers.get('content-type')||''))throw Error('HTTP/MIME '+res.status);
   const b=Buffer.from(await res.arrayBuffer());if(b.length!==info.size||hash(b,'sha1')!==info.sha1||b[0]!==255||b[1]!==216)throw Error('Original length/hash/marker mismatch');
   row.file='candidate-'+i+'.jpg';row.bytes=b.length;row.sha256=hash(b);writeFileSync(dir+'/'+row.file,b);
  }catch(e){report.errors.push({title,error:String(e)})}
 }
}catch(e){report.errors.push({error:String(e)})}
writeFileSync(dir+'/report.json',JSON.stringify(report,null,2));
console.log('PHOTO_BATCH_REPORT '+JSON.stringify({expected:titles.length,reviewed:report.entries.length,downloaded:report.entries.filter(x=>x.file).length,errors:report.errors,publicationCount:0}));
if(report.errors.length)process.exitCode=1;
