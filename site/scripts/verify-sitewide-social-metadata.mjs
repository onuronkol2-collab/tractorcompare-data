/** Verify complete, unique, consistent share metadata on every published canonical HTML page. */
import {readdirSync,readFileSync} from "node:fs";
import {join,relative,resolve} from "node:path";
import {fileURLToPath} from "node:url";

const readAttr=(tag,key)=>new RegExp("(?:^|\\s)"+key+"\\s*=\\s*[\"']([^\"']*)[\"']","i").exec(tag)?.[1]??null;
export function inspectSocialMetadata(html,file="index.html"){
  const head=/<head\b[^>]*>([\s\S]*?)<\/head\s*>/i.exec(html)?.[1];
  if(!head)return null;
  const metas=[...head.matchAll(/<meta\b[^>]*>/gi)].map(x=>x[0]);
  const links=[...head.matchAll(/<link\b[^>]*>/gi)].map(x=>x[0]);
  const canonical=links.find(tag=>readAttr(tag,"rel")?.toLowerCase().split(/\s+/).includes("canonical"));
  if(!canonical || metas.some(tag=>readAttr(tag,"name")?.toLowerCase()==="robots" &&
    /\bnoindex\b/i.test(readAttr(tag,"content")||"")))return null;
  const errors=[],get=name=>metas.filter(tag=>(readAttr(tag,"property")||readAttr(tag,"name"))?.toLowerCase()===name)
    .map(tag=>readAttr(tag,"content"));
  const values={};
  for(const tag of ["og:title","og:type","og:description","og:url","og:image","twitter:card","twitter:image"]){
    const matches=get(tag);
    if(matches.length!==1 || !matches[0]?.trim())errors.push(tag+" missing/duplicate/empty");
    else values[tag]=matches[0];
  }
  const url=readAttr(canonical,"href");
  if(values["og:url"] && values["og:url"]!==url)errors.push("og:url differs from canonical");
  if(values["og:image"] && values["twitter:image"] &&
    values["og:image"]!==values["twitter:image"])errors.push("social preview images differ");
  if(values["twitter:card"] && values["twitter:card"]!=="summary_large_image")
    errors.push("social preview card is not a large image");
  if(values["og:image"] && !/^https:\/\//.test(values["og:image"]))
    errors.push("social preview image is not absolute HTTPS");
  return {file,errors,brandFallback:values["og:image"]==="https://tractorvs.com/images/tractorvs-share-card.png"};
}
export function auditBuiltSocialMetadata(directory){
  const root=resolve(directory),summary={htmlDocuments:0,indexablePages:0,brandFallbackPages:0,errors:[]};
  function scan(dir){
    for(const item of readdirSync(dir,{withFileTypes:true})){
      const full=join(dir,item.name);
      if(item.isDirectory())scan(full);
      else if(item.isFile()&&item.name.endsWith(".html")){
        summary.htmlDocuments++;
        const name=relative(root,full).replaceAll("\\","/");
        const found=inspectSocialMetadata(readFileSync(full,"utf8"),name);
        if(!found)continue;
        summary.indexablePages++;
        if(found.brandFallback)summary.brandFallbackPages++;
        for(const code of found.errors)summary.errors.push({file:name,code});
      }
    }
  }
  scan(root);
  if(!summary.htmlDocuments || !summary.indexablePages)
    throw Error("No canonical indexable HTML pages found for social metadata audit");
  return summary;
}
if(process.argv[1] && resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  const report=auditBuiltSocialMetadata(process.argv[2]||"site/dist");
  console.log("TRACTORVS_SOCIAL_META_AUDIT "+JSON.stringify(report));
  if(report.errors.length)process.exitCode=1;
}
