/**
 * Map every published Chinese model page in the trusted image sitemap to the
 * exact registered copyright-claim image. Preserves duplicate variant pages.
 * This never invents an owner; it reads only the approved rights registry.
 */
export function copyrightZhSitemapPages(xml,approvedPhotos){
 if(typeof xml!=="string"||!Array.isArray(approvedPhotos))throw Error("Missing image sitemap or photo registry");
 const claims=new Map(approvedPhotos.filter(p=>p.copyrightOwner)
   .map(p=>[p.fileId,p]));
 const result=[],seen=new Set();
 for(const match of xml.matchAll(/<url(?:\s[^>]*)?>([\s\S]*?)<\/url>/g)){
  const block=match[1];
  const page=block.match(/<loc>([^<]+)<\/loc>/)?.[1]?.replaceAll("&amp;","&");
  if(!page)continue;
  const u=new URL(page);
  if(u.origin!=="https://tractorvs.com"||!/^\/zh\/tractors\/[^/]+\/$/.test(u.pathname))continue;
  for(const m of block.matchAll(/<image:loc>([^<]+)<\/image:loc>/g)){
   const image=m[1].replaceAll("&amp;","&");
   const id=/^https:\/\/tractorvs\.com\/images\/tractors\/([a-z0-9-]+)-1920\.jpg$/.exec(image)?.[1];
   if(!id||!claims.has(id))continue;
   const key=u.pathname+"|"+id;
   if(seen.has(key))continue;
   seen.add(key);
   const photo=claims.get(id);
   result.push({path:u.pathname,fileId:id,owner:photo.copyrightOwner,
      sourcePage:photo.sourcePage});
  }
 }
 return result;
}
