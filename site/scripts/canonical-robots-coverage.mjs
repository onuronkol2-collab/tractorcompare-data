// Scope: ASCII query-free canonical paths on TractorVS; no network access.
// https://developers.google.com/crawling/docs/robots-txt/robots-txt-spec
// Googlebot groups override wildcard groups. Merge repeated selected groups.
function matches(path,pattern){
 const anchored=pattern.endsWith("$");
 const body=anchored?pattern.slice(0,-1):pattern;
 const parts=body.split("*");
 if(!path.startsWith(parts[0]))return false;
 if(parts.length===1)return !anchored||path===body;
 let offset=parts[0].length;
 for(let i=1;i<parts.length;i++){
  const part=parts[i];
  if(i===parts.length-1&&anchored)
   return path.endsWith(part)&&path.length-part.length>=offset;
  const at=path.indexOf(part,offset);
  if(at<0)return false;
  offset=at+part.length;
 }
 return true;
}
export function googlebotRules(text){
 if(typeof text!=="string"||Buffer.byteLength(text)>500_000)throw Error("Unsupported robots.txt size");
 const groups=[];
 let group=null,hasRules=false;
 for(const line of text.replace(/^\uFEFF/,"").split(/\r?\n/)){
  const value=line.split("#",1)[0].trim();
  const colon=value.indexOf(":");
  if(colon<0)continue;
  const key=value.slice(0,colon).trim().toLowerCase(),token=value.slice(colon+1).trim();
  if(key==="user-agent"){
   if(!token)continue;
   if(!group||hasRules){group={agents:[],rules:[]};groups.push(group);hasRules=false;}
   group.agents.push(token==="*"?"*":token.toLowerCase().split(/[/*\s]/,1)[0]);
  }else if(group&&(key==="allow"||key==="disallow")){
   hasRules=true;
   if(!token||!token.startsWith("/"))continue;
   const pattern=token.replace(/%([0-9a-f]{2})/gi,(full,hex)=>{
    const c=String.fromCharCode(parseInt(hex,16));
    return /[A-Za-z0-9._~-]/.test(c)?c:full.toUpperCase();
   }).replace(/\*+$/,"");
   group.rules.push({allow:key==="allow",pattern});
  }
 }
 const explicit=groups.filter(g=>g.agents.includes("googlebot"));
 return (explicit.length?explicit:groups.filter(g=>g.agents.includes("*"))).flatMap(g=>g.rules);
}
export function blockedCanonicalPaths(text,paths){
 const rules=googlebotRules(text);
 return [...paths].filter(path=>{
  if(!/^\/[A-Za-z0-9._~/-]*$/.test(path))throw Error("Unsupported canonical crawl path");
  let winner=null;
  for(const rule of rules){
   if(!matches(path,rule.pattern))continue;
   if(!winner||rule.pattern.length>winner.pattern.length||
      (rule.pattern.length===winner.pattern.length&&rule.allow))winner=rule;
  }
  return winner!==null&&!winner.allow;
 });
}
