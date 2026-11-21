/**
 * Read-only image-sitemap asset integrity, checked against the *already*
 * published canonical HTML / moderated forum sitemap page sets.
 *
 * A public forum-media gateway image is permitted only on a page that passes
 * the forum sitemap approval gate; arbitrary Supabase or third-party URLs are
 * never trusted. This module does not approve image ownership or licenses.
 */
export const TRACTORVS_ORIGIN="https://tractorvs.com";
export const PUBLIC_FORUM_MEDIA_ENDPOINT=
  "https://aaufxtcvnzgavtlintiv.supabase.co/functions/v1/forum-media";
function invalid(msg){throw Error("[TractorVS image SEO] "+msg);}
function exactPageUrl(raw){
 let url;
 try{url=new URL(raw)}catch{invalid("Malformed image sitemap page URL")}
 if(url.origin!==TRACTORVS_ORIGIN||url.search||url.hash||url.href!==raw||
    !url.pathname.endsWith("/"))invalid("Noncanonical image sitemap page "+raw);
 return url.href;
}
export function classifyPublicImageSitemap(xml,{htmlPages,forumPages}){
 if(typeof xml!=="string"||!/<urlset(?:\s|>)/.test(xml))
  invalid("Invalid image XML sitemap");
 if(!(htmlPages instanceof Set)||!(forumPages instanceof Set))
  invalid("Missing trusted published sitemap page sets");
 const models=new Set(),forumAssets=new Set(),pages=new Set();
 let imageReferences=0;
 for(const [,block] of xml.matchAll(/<url(?:\s[^>]*)?>([\s\S]*?)<\/url>/g)){
  const locs=[...block.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m=>m[1].replaceAll("&amp;","&"));
  if(locs.length!==1)invalid("Missing/repeated page <loc> in image URL entry");
  const page=exactPageUrl(locs[0]);
  if(!htmlPages.has(page)&&!forumPages.has(page))
   invalid("Image references unpublished/unapproved page "+page);
  if(pages.has(page))invalid("Duplicate image sitemap page "+page);
  pages.add(page);
  const imageUrls=[...block.matchAll(/<image:loc>([^<]+)<\/image:loc>/g)]
   .map(m=>m[1].replaceAll("&amp;","&"));
  if(!imageUrls.length)invalid("Image sitemap entry lacks image:loc "+page);
  const uniqueImages=new Set();
  for(const imageUrl of imageUrls){
   if(uniqueImages.has(imageUrl))invalid("Duplicate image URL on page "+page);
   uniqueImages.add(imageUrl);
   imageReferences++;
   if(imageUrl.startsWith(TRACTORVS_ORIGIN+"/images/tractors/")){
    if(!htmlPages.has(page)||!/^\/(?:tr\/|zh\/|hi\/|pt-br\/|fr\/|de\/|ru\/|ja\/|es\/)?tractors\/[^/]+\/$/.test(new URL(page).pathname))
     invalid("Tractor photo listed outside an approved model page "+page);
    const match=/^https:\/\/tractorvs\.com\/images\/tractors\/([a-z0-9-]+)-1920\.jpg$/.exec(imageUrl);
    if(!match)invalid("Invalid first-party tractor JPEG URL "+imageUrl);
    models.add(match[1]);
    continue;
   }
   let media;
   try{media=new URL(imageUrl)}catch{invalid("Malformed forum image URL")}
   const query=[...media.searchParams.keys()];
   const uuid=media.searchParams.get("id");
   if(media.origin+media.pathname!==PUBLIC_FORUM_MEDIA_ENDPOINT||
      media.hash||query.length!==1||query[0]!=="id"||
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(uuid||"")||
      !forumPages.has(page)||
      !/^\/(?:tr\/|zh\/|hi\/|pt-br\/|fr\/|de\/|ru\/|ja\/|es\/)?forum\/[a-z0-9-]+\/$/.test(new URL(page).pathname))
    invalid("External, malformed or unapproved forum image URL "+imageUrl);
   forumAssets.add(imageUrl);
  }
 }
 return {models,forumAssets,pages,imageReferences};
}
