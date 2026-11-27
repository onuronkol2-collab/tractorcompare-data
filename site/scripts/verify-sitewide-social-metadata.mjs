/** Verify complete, unique, consistent share metadata on every published canonical HTML page. */
import {builtHtmlDocuments} from "./built-html-documents.mjs";
import {resolve} from "node:path";
import {fileURLToPath} from "node:url";

import {readOpeningTagAttribute as readAttr} from "./seo-html-attributes.mjs";
import {scanHeadTags} from "./verify-sitewide-meta-descriptions.mjs";

export function inspectSocialMetadata(html,file="index.html",parsedHead){
  const head=/<head\b[^>]*>([\s\S]*?)<\/head\s*>/i.exec(html)?.[1];
  if(!head)return null;
  const {metas,links}=parsedHead??scanHeadTags(head);
  const canonical=links.find(tag=>readAttr(tag,"rel")?.toLowerCase().split(/\s+/).includes("canonical"));
  if(!canonical || metas.some(tag=>readAttr(tag,"name")?.toLowerCase()==="robots" &&
    /\bnoindex\b/i.test(readAttr(tag,"content")||"")))return null;
  // Index each metadata name once; retain ordering and duplicate entries.
  // Keep property-before-name precedence identical to the original inspector.
  const byName=new Map();
  for(const tag of metas){
    const name=(readAttr(tag,"property")||readAttr(tag,"name"))?.toLowerCase();
    if(!name)continue;
    const values=byName.get(name)??[];
    values.push(readAttr(tag,"content"));
    byName.set(name,values);
  }
  const errors=[],get=name=>byName.get(name)??[];
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
  const brandFallback=values["og:image"]==="https://tractorvs.com/images/tractorvs-share-card.png";
  const modelPage=/\/tractors\/[^/]+\/$/.test(new URL(url||"https://tractorvs.com/","https://tractorvs.com").pathname);
  // Custom images elsewhere need their own reviewed description. Require
  // matching, nonempty alt for the known model-photo and brand-fallback paths.
  if(modelPage||brandFallback){
    const alts=["og:image:alt","twitter:image:alt"].map(tag=>{
      const matches=get(tag);
      if(matches.length!==1||!matches[0]?.trim())errors.push(tag+" missing/duplicate/empty");
      return matches[0];
    });
    if(alts[0]&&alts[1]&&alts[0]!==alts[1])errors.push("social preview alternative texts differ");
    if(brandFallback&&alts.some(alt=>alt&&alt!=="TractorVS"))errors.push("brand fallback alt misidentifies image");
  }
  return {file,errors,brandFallback};
}
export function createSocialMetadataCollector(root){
  const summary={htmlDocuments:0,indexablePages:0,brandFallbackPages:0,errors:[]};
  return {
    add(file,html,parsedHead){
      summary.htmlDocuments++;
      const found=inspectSocialMetadata(html,file,parsedHead);
      if(!found)return;
      summary.indexablePages++;
      if(found.brandFallback)summary.brandFallbackPages++;
      for(const code of found.errors)summary.errors.push({file,code});
    },
    finish(){
      if(!summary.htmlDocuments || !summary.indexablePages)
        throw Error("No canonical indexable HTML pages found for social metadata audit");
      return summary;
    }
  };
}

export function auditBuiltSocialMetadata(directory){
  const root=resolve(directory);
  const collector=createSocialMetadataCollector(root);
  for(const {file,html} of builtHtmlDocuments(root))collector.add(file,html);
  return collector.finish();
}

if(process.argv[1] && resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  const report=auditBuiltSocialMetadata(process.argv[2]||"site/dist");
  console.log("TRACTORVS_SOCIAL_META_AUDIT "+JSON.stringify(report));
  if(report.errors.length)process.exitCode=1;
}
