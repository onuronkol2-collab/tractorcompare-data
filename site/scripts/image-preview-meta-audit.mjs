/** Pure HTML meta audit: only exact registered first-party tractor images pass. */
function attr(tag,key){
 for(const found of String(tag).matchAll(/\s([a-zA-Z:-]+)\s*=\s*(?:"([^"]*)"|'([^']*)')/g))
  if(found[1].toLowerCase()===key.toLowerCase())return found[2]??found[3];
 return null;
}
export function previewMetadataIssues(html,{canonical,ogImage,jsonLdImage}){
 const errors=[];
 if(typeof html!=="string"||!/^https:\/\/tractorvs\.com\/(?:[a-z-]+\/)?tractors\/[a-z0-9-]+\/$/.test(canonical||"")||
  !/^https:\/\/tractorvs\.com\/images\/tractors\/[a-z0-9-]+-1920\.jpg$/.test(ogImage||""))
  return ["invalid expected model URL or unapproved photo"];
 const head=/<head(?:\s[^>]*)?>([\s\S]*?)<\/head>/i.exec(html)?.[1];
 if(!head)return ["missing server-rendered head"];
 const meta=[...head.matchAll(/<meta\b[^>]*>/gi)].map(m=>m[0]);
 const links=[...head.matchAll(/<link\b[^>]*>/gi)].map(m=>m[0]);
 const read=name=>meta.filter(tag=>(attr(tag,"name")||attr(tag,"property"))?.toLowerCase()===name)
  .map(tag=>attr(tag,"content"));
 for(const [name,expected] of [["og:image",ogImage],["twitter:image",ogImage],["twitter:card","summary_large_image"]]){
  const values=read(name);
  if(values.length!==1||values[0]!==expected)errors.push(name+" mismatch or duplicate");
 }
 const canon=links.filter(tag=>String(attr(tag,"rel")||"").toLowerCase().split(/\s+/).includes("canonical"))
  .map(tag=>attr(tag,"href"));
 if(canon.length!==1||canon[0]!==canonical)errors.push("canonical mismatch");
 const robots=read("robots");
 if(robots.length!==1||!robots[0]?.toLowerCase().split(",").map(x=>x.trim()).includes("max-image-preview:large"))
  errors.push("robots missing max-image-preview:large");
 if(jsonLdImage!==ogImage)errors.push("ImageObject photo mismatch");
 return errors;
}
