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
import {readdirSync,readFileSync} from "node:fs";
import {join,relative,resolve} from "node:path";
import {fileURLToPath} from "node:url";

const IMG=/<img\b(?:[^>"']|"[^"]*"|'[^']*')*>/gi;
const ALT=/\s+alt\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>]+))/i;
const SRC=/\s+src\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>]+))/i;

export function inspectDocumentImageAlts(html){
  // JavaScript literals such as "<img src='sample'>" are not HTML images.
  const markup=html.replace(/<!--[\s\S]*?-->/g,"")
    .replace(/<(script|style|textarea)\b[^>]*>[\s\S]*?<\/\1\s*>/gi,"");
  let images=0,nonemptyAlt=0,emptyAlt=0;
  const missingAlt=[];
  for(const match of markup.matchAll(IMG)){
    const tag=match[0];
    images++;
    const alt=tag.match(ALT);
    if(!alt){
      const src=tag.match(SRC);
      missingAlt.push({index:images,src:(src?.[1]??src?.[2]??src?.[3]??"").slice(0,180)});
    }else if((alt[1]??alt[2]??alt[3]??"")===""){
      emptyAlt++;
    }else{
      nonemptyAlt++;
    }
  }
  return {images,nonemptyAlt,emptyAlt,missingAlt};
}

export function auditBuiltImageAlts(dist){
  const root=resolve(dist);
  const summary={htmlPages:0,images:0,nonemptyAlt:0,emptyAlt:0,missingAlt:[]};
  function scan(dir){
    for(const entry of readdirSync(dir,{withFileTypes:true})){
      const path=join(dir,entry.name);
      if(entry.isDirectory()){
        scan(path);
      }else if(entry.isFile()&&entry.name.endsWith(".html")){
        const file=relative(root,path).replaceAll("\\","/");
        const page=inspectDocumentImageAlts(readFileSync(path,"utf8"));
        summary.htmlPages++;
        summary.images+=page.images;
        summary.nonemptyAlt+=page.nonemptyAlt;
        summary.emptyAlt+=page.emptyAlt;
        for(const issue of page.missingAlt)summary.missingAlt.push({file,...issue});
      }
    }
  }
  scan(root);
  if(summary.htmlPages===0)throw Error("Image-alt audit: no built HTML files found in "+root);
  return summary;
}

if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  try{
    const dist=resolve(process.argv[2]||new URL("../dist/",import.meta.url).pathname);
    const report=auditBuiltImageAlts(dist);
    console.log("TRACTORVS_SITEWIDE_IMAGE_ALT "+JSON.stringify({
      htmlPages:report.htmlPages,images:report.images,
      descriptiveAlt:report.nonemptyAlt,decorativeOrPendingAlt:report.emptyAlt,
      missingAlt:report.missingAlt.length
    }));
    if(report.missingAlt.length){
      console.error("IMAGE_ALT_MISSING "+JSON.stringify(report.missingAlt.slice(0,40)));
      process.exitCode=1;
    }
  }catch(e){
    console.error("IMAGE_ALT_AUDIT_FAILED "+String(e?.message||e));
    process.exitCode=1;
  }
}
