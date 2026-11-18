// Credential-free check of TractorVS public Google Images prerequisites.
const origin="https://tractorvs.com";
const errors=[];
function fail(message){errors.push(message);console.error("IMAGE_ERROR "+message)}
async function get(url,attempts=3){
  let last;
  for(let i=0;i<attempts;i++){
    try{
      const r=await fetch(url,{signal:AbortSignal.timeout(22000),redirect:"follow"});
      const bytes=new Uint8Array(await r.arrayBuffer());
      if([429,502,503,504].includes(r.status)&&i<attempts-1){
        last=new Error("Transient "+r.status+" "+url);
      }else return {r,bytes};
    }catch(e){last=e;}
    if(i<attempts-1)await new Promise(res=>setTimeout(res,(i+1)*500));
  }
  throw last||new Error("Missing HTTP response");
}
const paths=[
  "belarus-82-1-homoatrox-2019",
  "new-holland-t5-110-pere-igor-2016",
  "new-holland-t6-180-marcelx42-2025",
  "case-ih-puma-150-chris-woodrich-2025"
];
for(const name of paths){
 const url=origin+"/images/tractors/"+name+"-960.jpg";
 try{
  const {r,bytes}=await get(url);
  const jpeg=bytes.length>1000&&bytes[0]===255&&bytes[1]===216&&bytes[2]===255;
  console.log("TRACTOR_IMAGE "+JSON.stringify({url,status:r.status,type:r.headers.get("content-type"),bytes:bytes.length,jpeg}));
  if(!r.ok||!jpeg||!(r.headers.get("content-type")||"").includes("image/jpeg"))
    fail("Bad first-party photograph "+name+" status="+r.status);
 }catch(e){fail("Fetch "+name+" "+String(e));}
}
const sitemapUrl=origin+"/image-sitemap.xml";
try{
 const {r,bytes}=await get(sitemapUrl);
 const xml=new TextDecoder().decode(bytes);
 const urls=[...xml.matchAll(/<image:loc>([^<]+)<\/image:loc>/g)].map(m=>m[1]);
 console.log("TRACTOR_IMAGE_SITEMAP "+JSON.stringify({http:r.status,count:urls.length,first:urls[0]}));
 if(!r.ok||!xml.includes('xmlns:image=')||urls.length<1)
   fail("Invalid/empty image sitemap "+r.status);
 if(urls.some(u=>!u.startsWith(origin+"/images/tractors/")))
   fail("Image sitemap must use first-party image URLs");
}catch(e){fail("Image sitemap fetch "+String(e));}
try{
 const {r,bytes}=await get(origin+"/tr/tractors/belarus-82-1-940a988a/");
 const html=new TextDecoder().decode(bytes);
 console.log("TRACTOR_IMAGE_DETAIL "+JSON.stringify({http:r.status,hasImage:html.includes("/images/tractors/"),imageObject:html.includes("ImageObject"),hasAttribution:html.includes("Homoatrox")}));
 if(r.status!==200||!html.includes("ImageObject")||!html.includes("Homoatrox"))
   fail("Belarus 82.1 model page missing photo, license or ImageObject");
}catch(e){fail("Model detail "+String(e));}
console.log("TRACTOR_IMAGE_AUDIT_SUMMARY "+JSON.stringify({checked:paths.length,errors:errors.length}));
if(errors.length)process.exitCode=1;
