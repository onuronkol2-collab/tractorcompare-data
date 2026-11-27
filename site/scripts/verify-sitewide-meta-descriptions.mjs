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
import {readOpeningTagAttribute as attribute} from "./seo-html-attributes.mjs";

/**
 * Scan actual opening tags without rewriting HTML. A regex strip of comments
 * and <script>...</script> can join separate fragments into a NEW <meta> or
 * <link> tag and make the SEO audit believe it existed in the source.
 *
 * The input is generated static HTML, not a browser sanitizer. Never execute,
 * echo into HTML, or mutate any source content; skip comments and rawtext
 * nodes in place, respecting quoted attributes and their embedded '>' signs.
 */
export function scanHeadTags(head){
  const links=[],metas=[],titles=[];
  let templateDepth=0;
  let cursor=0;
  // Sticky matching reads the original string at the exact tag offset,
  // avoiding repeated suffix allocations without changing tag boundaries.
  const opening=/<(\/?)([a-z][a-z0-9:-]*)/iy;
  while(cursor<head.length){
    const start=head.indexOf("<",cursor);
    if(start<0)break;
    if(head.startsWith("<!--",start)){
      const close=head.indexOf("-->",start+4);
      if(close<0)break;
      cursor=close+3;
      continue;
    }
    opening.lastIndex=start;
    const match=opening.exec(head);
    if(!match){cursor=start+1;continue;}
    const afterName=start+match[0].length;
    if(afterName>=head.length||!/[\s/>]/.test(head[afterName])){
      cursor=afterName;
      continue;
    }
    let quote="";
    let end=-1;
    for(let position=afterName;position<head.length;position++){
      const character=head[position];
      if(quote){
        if(character===quote)quote="";
      }else if(character==='"'||character==="'"){
        quote=character;
      }else if(character===">"){
        end=position;
        break;
      }
    }
    if(end<0)break;
    cursor=end+1;
    const name=match[2].toLowerCase();
    if(match[1]){
      if(name==="template"&&templateDepth)templateDepth--;
      continue;
    }
    if(name==="template"){templateDepth++;continue;}
    const tag=head.slice(start,cursor);
    if(!templateDepth){
      if(name==="link")links.push(tag);
      else if(name==="meta")metas.push(tag);
    }
    if(["script","style","title","textarea","noscript"].includes(name)){
      // Raw text/RCDATA and inert head noscript: do not count embedded markup.
      const closing=new RegExp("</"+name+"(?=[\\s>])[^>]*>","gi");
      closing.lastIndex=cursor;
      const endTag=closing.exec(head);
      if(!endTag)break;
      if(name==="title"&&!templateDepth)titles.push(head.slice(cursor,endTag.index));
      cursor=closing.lastIndex;
    }
  }
  return {links,metas,titles};
}
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
  // Inspect source tags directly: do not strip markup into newly joined tags.
  const {links,metas}=scanHeadTags(head);
  const canonical=links.some(tag=>(attribute(tag,"rel")||"").toLowerCase().split(/\s+/).includes("canonical"));
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

/** Exact reuse is an editorial review signal, not proof of duplicate content.
 * Scope same-language groups to distinct canonical pages. Cross-language
 * groups compare only the same model route, not unrelated technical records.
 * A sampled crawl can establish observed reuse, never absence sitewide.
 */
export function descriptionReuseGroups(records){
  const same=new Map(),cross=new Map();
  for(const {file,description} of records){
    if(typeof file!=="string"||typeof description!=="string"||!description.trim())continue;
    const normalized=description.normalize("NFC").replace(/\s+/g," ").trim();
    const first=file.split("/")[0],locale=locales.has(first)?first:"en";
    const key=JSON.stringify([locale,normalized]);
    const group=same.get(key)??{locale,description:normalized,files:new Set()};
    group.files.add(file);same.set(key,group);
    const model=/^(?:(tr|zh|hi|pt-br|fr|de|ru|ja|es)\/)?tractors\/([^/]+)\/index\.html$/.exec(file);
    if(!model)continue;
    const crossKey=JSON.stringify([model[2],normalized]);
    const candidate=cross.get(crossKey)??{slug:model[2],description:normalized,locales:new Map()};
    candidate.locales.set(locale,file);cross.set(crossKey,candidate);
  }
  return {
    sameLocale:[...same.values()].filter(g=>g.files.size>1)
      .map(({locale,description,files})=>({locale,description,files:[...files].sort()}))
      .sort((a,b)=>a.locale.localeCompare(b.locale)||a.description.localeCompare(b.description)),
    crossLocale:[...cross.values()].filter(g=>g.locales.size>1)
      .map(({slug,description,locales})=>({slug,description,locales:[...locales.keys()].sort(),files:[...locales.values()].sort()}))
      .sort((a,b)=>a.slug.localeCompare(b.slug)||a.description.localeCompare(b.description)),
  };
}

export function auditBuiltMetaDescriptions(directory){
  const root=resolve(directory);
  const result={htmlDocuments:0,indexablePages:0,over160:0,byLocale:{},errors:[],longExamples:[]};
  const records=[];
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
        if(!meta.errors.length)records.push({file,description:meta.description});
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
  result.reuse=descriptionReuseGroups(records);
  return result;
}

if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  try{
    const report=auditBuiltMetaDescriptions(process.argv[2]||"site/dist");
    console.log("TRACTORVS_SITEWIDE_META_QA "+JSON.stringify({
      htmlDocuments:report.htmlDocuments,indexablePages:report.indexablePages,
      over160:report.over160,errors:report.errors.length,byLocale:report.byLocale,
      sameLocaleDescriptionGroups:report.reuse.sameLocale.length,crossLocaleDescriptionGroups:report.reuse.crossLocale.length
    }));
    if(report.longExamples.length)
      console.log("META_LENGTH_ADVISORIES "+JSON.stringify(report.longExamples.slice(0,12)));
    if(report.reuse.sameLocale.length||report.reuse.crossLocale.length)
      console.warn("META_DESCRIPTION_REUSE_REVIEW "+JSON.stringify(report.reuse));
    if(report.errors.length){
      console.error("META_DESCRIPTION_ERRORS "+JSON.stringify(report.errors.slice(0,30)));
      process.exitCode=1;
    }
  }catch(error){
    console.error("META_DESCRIPTION_AUDIT_FAILED "+String(error?.message||error));
    process.exitCode=1;
  }
}
