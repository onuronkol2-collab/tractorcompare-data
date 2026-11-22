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

/**
 * Full copyright validation on the scheduled/manual audit, AND whenever the
 * main-branch push audit is deliberately re-run after Cloudflare deployment.
 * An initial push can race production deployment and must remain a smoke test.
 * Re-running a PR must never be mistaken for deployed main.
 */
export function strictCopyrightAuditMode({eventName,ref,runAttempt}){
  if(eventName==="schedule"||eventName==="workflow_dispatch")return true;
  if(eventName!=="push"||ref!=="refs/heads/main")return false;
  const attempt=String(runAttempt??"");
  return /^[1-9][0-9]*$/.test(attempt)&&Number(attempt)>1;
}


/**
 * Bounded live multilingual sampling: one verified source photograph per
 * canonical locale other than Chinese (Chinese pages have a full audit).
 * Read only the canonical image sitemap. If any required locale has no
 * verified photograph, fail closed rather than silently skipping a language.
 */
export function copyrightLocaleSitemapSamples(xml,approvedPhotos,locales){
 if(typeof xml!=="string"||!Array.isArray(approvedPhotos)||
   !Array.isArray(locales)||!locales.length)
   throw Error("Missing image sitemap, photo registry or locale list");
 const required=[...new Set(locales)].filter(locale=>locale!=="zh");
 if(required.some(locale=>!["en","tr","hi","pt-br","fr","de","ru","ja","es"].includes(locale)))
   throw Error("Unknown locale in image rights sampling");
 const claims=new Map(approvedPhotos.filter(p=>p.copyrightOwner&&p.sourcePage)
   .map(p=>[p.fileId,p]));
 const found=new Map();
 for(const match of xml.matchAll(/<url(?:\s[^>]*)?>([\s\S]*?)<\/url>/g)){
   const block=match[1];
   const page=block.match(/<loc>([^<]+)<\/loc>/)?.[1]?.replaceAll("&amp;","&");
   if(!page)continue;
   let u;
   try{u=new URL(page);}catch{continue;}
   if(u.origin!=="https://tractorvs.com"||u.search||u.hash)continue;
   const m=/^\/(?:(tr|hi|pt-br|fr|de|ru|ja|es)\/)?tractors\/[^/]+\/$/.exec(u.pathname);
   if(!m)continue;
   const locale=m[1]||"en";
   if(!required.includes(locale)||found.has(locale))continue;
   for(const img of block.matchAll(/<image:loc>([^<]+)<\/image:loc>/g)){
     const url=img[1].replaceAll("&amp;","&");
     const id=/^https:\/\/tractorvs\.com\/images\/tractors\/([a-z0-9-]+)-1920\.jpg$/.exec(url)?.[1];
     if(!id||!claims.has(id))continue;
     const photo=claims.get(id);
     found.set(locale,{locale,path:u.pathname,fileId:id,
       owner:photo.copyrightOwner,sourcePage:photo.sourcePage});
     break;
   }
 }
 const missing=required.filter(locale=>!found.has(locale));
 if(missing.length)throw Error("No rights-verified image-sitemap example for locales: "+missing.join(","));
 return required.map(locale=>found.get(locale));
}
