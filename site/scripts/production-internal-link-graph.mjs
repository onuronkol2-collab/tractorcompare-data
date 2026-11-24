import {readOpeningTagAttribute} from "./seo-html-attributes.mjs";

// Static HTML anchor evidence, not a browser/Google crawl simulation. Ignore
// inert content and never count a fragment, query, redirect alias, external URL,
// canonical/link metadata or self-link as a verified incoming canonical anchor.
const rawText=new Set(["script","style","textarea","title","xmp","iframe","noembed","noframes","noscript"]);
const decode=s=>s.replace(/&(?:amp|quot|apos|lt|gt|#(?:x[0-9a-f]+|[0-9]+));/gi,entity=>{
 const key=entity.slice(1,-1).toLowerCase();
 const named={amp:"&",quot:'"',apos:"'",lt:"<",gt:">"};
 if(Object.hasOwn(named,key))return named[key];
 try{return String.fromCodePoint(key.startsWith("#x")?parseInt(key.slice(2),16):parseInt(key.slice(1),10));}
 catch{return entity;}
});
export function extractCanonicalAnchors(html,source,inventory){
 const src=new URL(source);
 const tags=/<!--[\s\S]*?(?:-->|$)|<\/?[a-z][\w:-]*(?=[\s/>])(?:[^"'<>]|"[^"]*"|'[^']*')*>/gi;
 const links=new Set();
 let templates=0,match,unsupportedBase=false;
 while((match=tags.exec(html))){
  const tag=match[0];
  if(tag.startsWith("<!--"))continue;
  const name=tag.match(/^<\/?([\w:-]+)/)?.[1]?.toLowerCase();
  const closing=tag.startsWith("</");
  if(name==="template"){templates=Math.max(0,templates+(closing?-1:1));continue;}
  if(!closing && rawText.has(name)){
   const end=new RegExp("</"+name+"\\s*>","ig");
   end.lastIndex=tags.lastIndex;
   const close=end.exec(html);
   tags.lastIndex=close?end.lastIndex:html.length;
   continue;
  }
  if(templates||closing)continue;
  if(name==="base" && readOpeningTagAttribute(tag,"href")!==null){unsupportedBase=true;continue;}
  if(name!=="a")continue;
  const href=readOpeningTagAttribute(tag,"href");
  if(href===null||!href.trim()||href.trim().startsWith("#"))continue;
  const rel=readOpeningTagAttribute(tag,"rel")??"";
  if(rel.toLowerCase().split(/\s+/).includes("nofollow"))continue;
  try{
   const target=new URL(decode(href),src);
   if(target.origin!==src.origin||target.username||target.password||target.search)continue;
   target.hash="";
   if(target.href!==src.href&&inventory.has(target.href))links.add(target.href);
  }catch{/* malformed anchors are not discovery evidence */}
 }
 // A base URL changes resolution for relative links; don't assert completeness
 // if a future template introduces one without supporting it explicitly.
 return {targets:unsupportedBase?[]:[...links].sort(),unsupportedBase};
}

export function summarizeCanonicalGraph(inventory,observed,{fullCoverage=false,roots=[]}={}){
 const inbound=new Map([...inventory].map(url=>[url,0]));
 const visited=new Set(), queue=[];
 let edges=0,unresolvedSources=0;
 for(const [source,entry] of observed){
  if(!inventory.has(source))continue;
  if(entry.unsupportedBase){unresolvedSources++;continue;}
  for(const target of new Set(entry.targets)){
   if(target===source||!inventory.has(target))continue;
   inbound.set(target,inbound.get(target)+1);edges++;
  }
 }
 const complete=fullCoverage&&observed.size===inventory.size&&unresolvedSources===0&&[...inventory].every(url=>observed.has(url));
 const validRoots=[...new Set(roots)].filter(url=>inventory.has(url));
 for(const root of validRoots){visited.add(root);queue.push(root);}
 for(let i=0;i<queue.length;i++){
  for(const target of observed.get(queue[i])?.targets??[]){
   if(inventory.has(target)&&!visited.has(target)){visited.add(target);queue.push(target);}
  }
 }
 // Partial samples provide positive observed edges only, never orphan claims.
 // Exclude deliberate entry roots from no-incoming candidates, report
 // disconnected clusters separately (a cycle may have incoming links).
 const rootSet=new Set(validRoots);
 const noIncoming=complete?[...inbound].filter(([url,n])=>n===0&&!rootSet.has(url)).map(([url])=>url).sort():null;
 const unreachable=complete&&validRoots.length?[...inventory].filter(url=>!visited.has(url)).sort():null;
 return {complete,observedSources:observed.size,inventoryPages:inventory.size,unresolvedSources,
  verifiedEdges:edges,roots:validRoots,reachableObserved:visited.size,
  noIncomingCount:noIncoming?.length??null,unreachableCount:unreachable?.length??null,
  noIncoming,unreachable};
}
