/**
 * Full-build meta-description QA for canonical, indexable TractorVS pages.
 *
 * A missing, duplicate or empty description is a structural SEO regression.
 * 160 characters is only an editorial/snippet heuristic, not a Google rule:
 * do not pad, invent facts or truncate technical identities to reach a score.
 * Noindex previews and search-engine ownership files are not editorial pages.
 */
import {readdirSync,readFileSync} from "node:fs";
import {join,relative,resolve} from "node:path";
import {fileURLToPath} from "node:url";

const tagPattern=type=>new RegExp("<"+type+"\\b(?:[^\"'>]|\"[^\"]*\"|'[^']*')*>","gi");
const attribute=(tag,name)=>{
  const expression=new RegExp("(?:^|\\s)"+name+"\\s*=\\s*(?:\"([^\"]*)\"|'([^']*)'|([^\\s/>]+))","i");
  const found=tag.match(expression);
  return found?(found[1]??found[2]??found[3]??""):null;
};
const displayText=value=>value.replace(/&(?:amp|lt|gt|quot|apos|nbsp|#(?:x[0-9a-f]+|[0-9]+));/gi,token=>{
  const key=token.slice(1,-1).toLowerCase();
  const names={amp:"&",lt:"<",gt:">",quot:'"',apos:"'",nbsp:" "};
  if(Object.hasOwn(names,key))return names[key];
  const number=key.startsWith("#x")?Number.parseInt(key.slice(2),16):Number.parseInt(key.slice(1),10);
  try{return String.fromCodePoint(number);}catch{return token;}
}).replace(/\s+/g," ").trim();

const locales=new Set(["tr","zh","hi","pt-br","fr","de","ru","ja","es"]);

export function inspectMetaDescription(html,file="index.html"){
  if(!/<html\b/i.test(html))return null;
  const head=html.match(/<head\b[^>]*>([\s\S]*?)<\/head\s*>/i)?.[1];
  if(!head)return null;
  // Embedded JS or comments can contain literal "<meta ...>" strings.
  const visibleHead=head.replace(/<!--[\s\S]*?-->|<(script|style)\b[^>]*>[\s\S]*?<\/\1\s*>/gi,"");
  const links=[...visibleHead.matchAll(tagPattern("link"))].map(match=>match[0]);
  const canonical=links.some(tag=>(attribute(tag,"rel")||"").toLowerCase().split(/\s+/).includes("canonical"));
  const metas=[...visibleHead.matchAll(tagPattern("meta"))].map(match=>match[0]);
  const noindex=metas.some(tag=>(attribute(tag,"name")||"").toLowerCase()==="robots"
    && /\bnoindex\b/i.test(attribute(tag,"content")||""));
  // Only canonical, indexable pages are actionable. Other production gates
  // separately require published home/model pages and full canonical coverage.
  if(!canonical||noindex)return null;
  const found=metas.filter(tag=>(attribute(tag,"name")||"").toLowerCase()==="description");
  const description=found.length===1?displayText(attribute(found[0],"content")||""):"";
  const errors=[];
  if(found.length!==1)errors.push("missing-or-duplicate-description");
  else if(!description)errors.push("empty-description");
  const locale=file.split("/")[0];
  return {description,length:description.length,locale:locales.has(locale)?locale:"en",errors};
}

export function auditBuiltMetaDescriptions(directory){
  const root=resolve(directory);
  const result={htmlDocuments:0,indexablePages:0,over160:0,byLocale:{},errors:[],longExamples:[]};
  function scan(current){
    for(const entry of readdirSync(current,{withFileTypes:true})){
      const path=join(current,entry.name);
      if(entry.isDirectory())scan(path);
      else if(entry.isFile()&&entry.name.endsWith(".html")){
        const file=relative(root,path).replaceAll("\\","/");
        result.htmlDocuments++;
        const meta=inspectMetaDescription(readFileSync(path,"utf8"),file);
        if(!meta)continue;
        result.indexablePages++;
        const group=result.byLocale[meta.locale]??={pages:0,over160:0};
        group.pages++;
        for(const code of meta.errors)result.errors.push({file,code});
        if(meta.length>160){
          result.over160++;
          group.over160++;
          if(result.longExamples.length<20)
            result.longExamples.push({file,length:meta.length});
        }
      }
    }
  }
  scan(root);
  if(result.htmlDocuments===0)throw Error("No HTML documents found for meta-description QA");
  if(result.indexablePages===0)throw Error("No canonical indexable pages found for meta-description QA");
  return result;
}

if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  try{
    const report=auditBuiltMetaDescriptions(process.argv[2]||"site/dist");
    console.log("TRACTORVS_SITEWIDE_META_QA "+JSON.stringify({
      htmlDocuments:report.htmlDocuments,indexablePages:report.indexablePages,
      over160:report.over160,errors:report.errors.length,byLocale:report.byLocale
    }));
    if(report.longExamples.length)
      console.log("META_LENGTH_ADVISORIES "+JSON.stringify(report.longExamples.slice(0,12)));
    if(report.errors.length){
      console.error("META_DESCRIPTION_ERRORS "+JSON.stringify(report.errors.slice(0,30)));
      process.exitCode=1;
    }
  }catch(error){
    console.error("META_DESCRIPTION_AUDIT_FAILED "+String(error?.message||error));
    process.exitCode=1;
  }
}
