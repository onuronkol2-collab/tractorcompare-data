/**
 * TractorVS whole-site image alternative-text check.
 *
 * Unlike the main-landmark-only SEO sampling, this scans every <img> in every
 * built HTML file, including headers, forum profiles, dialogs and noindex pages
 * across all ten locales. Non-rendered script/style/textarea content and HTML
 * comments are excluded.
 *
 * A missing alt ATTRIBUTE is a defect. A present alt="" is valid for decorative
 * images, and for an unpopulated image element that gets a meaningful alt when
 * activated. Never invent keyword-heavy alt text to satisfy a crawler score.
 */
import {builtHtmlDocuments} from "./built-html-documents.mjs";
import {resolve} from "node:path";
import {fileURLToPath} from "node:url";

const IGNORED_OR_IMG=/<!--[\s\S]*?-->|<(script|style|textarea)\b[^>]*>[\s\S]*?<\/\1\s*>|<img\b(?:[^>\"']|\"[^\"]*\"|'[^']*')*>/gi;

// Parse attribute names, not substrings of quoted values. For example,
// <img title="missing alt=foo"> has NO alt attribute and must fail the gate.
function imageAttribute(tag,target){
  let i=4; // after "<img"
  while(i<tag.length){
    while(i<tag.length&&(/[\s/]/.test(tag[i])))i++;
    if(i>=tag.length||tag[i]===">")break;
    const start=i;
    while(i<tag.length&&!/[\s=/>]/.test(tag[i]))i++;
    if(i===start){i++;continue;}
    const name=tag.slice(start,i).toLowerCase();
    while(i<tag.length&&/\s/.test(tag[i]))i++;
    let value=null;
    if(tag[i]==="="){
      i++;
      while(i<tag.length&&/\s/.test(tag[i]))i++;
      if(tag[i]==='"'||tag[i]==="'"){
        const quote=tag[i++];
        const begin=i;
        while(i<tag.length&&tag[i]!==quote)i++;
        value=tag.slice(begin,i);
        if(tag[i]===quote)i++;
      }else{
        const begin=i;
        while(i<tag.length&&!/[\s>]/.test(tag[i]))i++;
        value=tag.slice(begin,i);
      }
    }
    if(name===target)return {value};
  }
  return null;
}

// One token scan serves both audits. Keep the public standalone inspectors
// and their report shapes unchanged; no DOM rewrite or new accepted exception.
function inspectImageEvidence(html){
  let images=0,nonemptyAlt=0,emptyAlt=0;
  const missingAlt=[],undocumentedEmptyAlt=[];
  for(const match of html.matchAll(IGNORED_OR_IMG)){
    if(!/^<img\b/i.test(match[0]))continue;
    const tag=match[0];
    images++;
    const alt=imageAttribute(tag,"alt");
    if(!alt||alt.value===null){
      const src=imageAttribute(tag,"src");
      missingAlt.push({index:images,src:(src?.value||"").slice(0,180)});
    }else if(alt.value===""){
      emptyAlt++;
      const src=imageAttribute(tag,"src")?.value||"";
      const srcset=imageAttribute(tag,"srcset")?.value||"";
      const id=imageAttribute(tag,"id")?.value||"";
      const role=imageAttribute(tag,"role")?.value||"";
      const ariaHidden=imageAttribute(tag,"aria-hidden")?.value||"";
      // Avatar text is redundant; the dormant lightbox has no source yet.
      if(src==="/images/forum-member-default.svg"&&!srcset)continue;
      if(id==="tractor-photo-dialog-img"&&!src&&!srcset)continue;
      if(role==="presentation"||role==="none"||ariaHidden==="true")continue;
      undocumentedEmptyAlt.push({index:images,src:src.slice(0,180),id});
    }else{
      nonemptyAlt++;
    }
  }
  return {images,nonemptyAlt,emptyAlt,missingAlt,undocumentedEmptyAlt};
}

export function inspectDocumentImageAlts(html){
  const {images,nonemptyAlt,emptyAlt,missingAlt}=inspectImageEvidence(html);
  return {images,nonemptyAlt,emptyAlt,missingAlt};
}

export function inspectUndocumentedEmptyImageAlts(html){
  return inspectImageEvidence(html).undocumentedEmptyAlt;
}

export function createImageAltCollector(root){
  const summary={htmlPages:0,images:0,nonemptyAlt:0,emptyAlt:0,missingAlt:[],undocumentedEmptyAlt:[]};
  return {
    add(file,html){
      const page=inspectImageEvidence(html);
      summary.htmlPages++;
      summary.images+=page.images;
      summary.nonemptyAlt+=page.nonemptyAlt;
      summary.emptyAlt+=page.emptyAlt;
      for(const issue of page.missingAlt)summary.missingAlt.push({file,...issue});
      for(const issue of page.undocumentedEmptyAlt)
        summary.undocumentedEmptyAlt.push({file,...issue});
    },
    finish(){
      if(summary.htmlPages===0)throw Error("Image-alt audit: no built HTML files found in "+root);
      return summary;
    }
  };
}

export function auditBuiltImageAlts(dist){
  const root=resolve(dist);
  const collector=createImageAltCollector(root);
  for(const {file,html} of builtHtmlDocuments(root))collector.add(file,html);
  return collector.finish();
}

if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  try{
    const dist=resolve(process.argv[2]||new URL("../dist/",import.meta.url).pathname);
    const report=auditBuiltImageAlts(dist);
    console.log("TRACTORVS_SITEWIDE_IMAGE_ALT "+JSON.stringify({
      htmlPages:report.htmlPages,images:report.images,
      descriptiveAlt:report.nonemptyAlt,decorativeOrPendingAlt:report.emptyAlt,
      missingAlt:report.missingAlt.length,
      undocumentedEmptyAlt:report.undocumentedEmptyAlt.length
    }));
    if(report.missingAlt.length||report.undocumentedEmptyAlt.length){
      if(report.missingAlt.length)
        console.error("IMAGE_ALT_MISSING "+JSON.stringify(report.missingAlt.slice(0,40)));
      if(report.undocumentedEmptyAlt.length)
        console.error("IMAGE_ALT_EMPTY_WITHOUT_CONTEXT "+
          JSON.stringify(report.undocumentedEmptyAlt.slice(0,40)));
      process.exitCode=1;
    }
  }catch(e){
    console.error("IMAGE_ALT_AUDIT_FAILED "+String(e?.message||e));
    process.exitCode=1;
  }
}
