/** Fail-closed proof for exactly three licensed, public Commons 720px pilot sources.
 * No Commons API searches, no model discovery, no private Supabase access.
 * One GET per approved file; never bypass 429, HTML, or missing image bytes.
 */
import {APPROVED_TRACTOR_PHOTOS,resolveApprovedPhotoSource} from "../src/lib/tractor-photos.ts";

export async function auditMobilePhoto720({fetchFn=fetch}={}){
  const photos=APPROVED_TRACTOR_PHOTOS.filter(photo=>photo.mediumUrl);
  if(photos.length!==3)throw Error("Exactly three reviewed 720px pilot photos are required");
  const result=[];
  for(const photo of photos){
    if(!photo.photographer||!/^CC BY-SA \d\.\d$/.test(photo.licenseName)||
       !photo.sourcePage.startsWith("https://commons.wikimedia.org/wiki/File:"))
      throw Error("Missing publication rights evidence: "+photo.fileId);
    const source=resolveApprovedPhotoSource(photo.mediumUrl);
    if(!source)throw Error("720px pilot source is not allowlisted: "+photo.fileId);
    const parsed=new URL(source);
    if(parsed.protocol!=="https:"||parsed.hostname!=="upload.wikimedia.org"||
       !parsed.pathname.includes("/720px-"))
      throw Error("Invalid approved Commons 720px URL: "+photo.fileId);
    let response;
    try{
      response=await fetchFn(source,{redirect:"follow",signal:AbortSignal.timeout(20000),
        headers:{"User-Agent":"TractorVS public photo quality proof (+https://tractorvs.com/)"}});
    }catch(error){throw Error("Commons pilot unavailable: "+photo.fileId+" "+String(error?.message||error));}
    if(response.status!==200)throw Error("Commons pilot HTTP "+response.status+": "+photo.fileId);
    if(!/^image\/jpeg(?:\s*;|\s*$)/i.test(response.headers.get("content-type")||""))
      throw Error("Commons pilot is not JPEG: "+photo.fileId);
    // Redirects must stay on Wikimedia infrastructure: no third-party images.
    if(response.url && new URL(response.url).hostname!=="upload.wikimedia.org")
      throw Error("Commons pilot redirected off-site: "+photo.fileId);
    const bytes=new Uint8Array(await response.arrayBuffer());
    if(bytes.length<10_000||bytes.length>3_000_000||
       bytes[0]!==0xff||bytes[1]!==0xd8||
       bytes[bytes.length-2]!==0xff||bytes[bytes.length-1]!==0xd9)
      throw Error("Commons pilot has invalid/truncated JPEG bytes: "+photo.fileId);
    result.push({fileId:photo.fileId,source,bytes:bytes.length,validJpeg:true,
      testedMode:"live_upstream_http_get",rightsFromExistingApprovedManifest:true});
  }
  return result;
}
if(import.meta.url===new URL("file://"+process.argv[1]).href){
  try{const rows=await auditMobilePhoto720();
    for(const row of rows)console.log("TRACTORVS_720_SOURCE_PROOF "+JSON.stringify(row));
    console.log("TRACTORVS_720_SOURCE_SUMMARY "+JSON.stringify({checked:rows.length,errors:0}));
  }catch(error){console.error("TRACTORVS_720_SOURCE_ERROR "+String(error?.message||error));process.exitCode=1;}
}
