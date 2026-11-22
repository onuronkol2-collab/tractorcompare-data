/**
 * Live, read-only evidence for the Cloudflare apex/www HTTPS redirect change.
 * Check every real HTTP response WITHOUT automatic redirects. The final
 * HTTP 200 alone does not prove any 301 Location header or query preservation.
 * This script does not use credentials, change DNS or deploy anything.
 */
import {resolve} from "node:path";
import {fileURLToPath} from "node:url";

export const CASES=[
  ["http://tractorvs.com/","https://tractorvs.com/"],
  ["http://tractorvs.com/tr/","https://tractorvs.com/tr/"],
  ["http://tractorvs.com/tr/tractors/","https://tractorvs.com/tr/tractors/"],
  ["https://www.tractorvs.com/","https://tractorvs.com/"],
  ["https://www.tractorvs.com/tr/tractors/","https://tractorvs.com/tr/tractors/"],
  ["https://www.tractorvs.com/tr/tractors/?utm_source=tractorvs_edge_audit&check=1",
   "https://tractorvs.com/tr/tractors/?utm_source=tractorvs_edge_audit&check=1"],
  ["http://www.tractorvs.com/tr/?utm_source=tractorvs_edge_audit&check=2",
   "https://tractorvs.com/tr/?utm_source=tractorvs_edge_audit&check=2"],
  ...["tr","zh","hi","pt-br","fr","de","ru","ja","es"].map(lang=>[
    "https://www.tractorvs.com/"+lang+"/",
    "https://tractorvs.com/"+lang+"/",
  ]),
];

const allowedOrigins=new Set([
  "http://tractorvs.com",
  "https://tractorvs.com",
  "http://www.tractorvs.com",
  "https://www.tractorvs.com",
]);

export async function inspectRedirectChain(source,expected,fetchFn=fetch){
  const hops=[];
  let url=source;
  const visited=new Set();
  for(let attempt=0;attempt<5;attempt++){
    if(visited.has(url))return {source,expected,hops,ok:false,error:"redirect-loop"};
    visited.add(url);
    const current=new URL(url);
    if(!allowedOrigins.has(current.origin))
      return {source,expected,hops,ok:false,error:"external-origin"};
    let response;
    try {
      response=await fetchFn(url,{
        method:"GET",redirect:"manual",signal:AbortSignal.timeout(12_000),
        headers:{"User-Agent":"TractorVS-edge-proof/1.0"},
      });
    }catch(error){
      return {source,expected,hops,ok:false,error:"network: "+String(error?.message||error).slice(0,140)};
    }
    const status=response.status;
    const rawLocation=response.headers.get("location");
    if([301,302,303,307,308].includes(status)){
      if(!rawLocation)return {source,expected,hops,ok:false,error:"redirect-without-location"};
      let next;
      try{next=new URL(rawLocation,url).toString();}
      catch{return {source,expected,hops,ok:false,error:"invalid-location"};}
      hops.push({url,status,location:next});
      if(![301,308].includes(status))
        return {source,expected,hops,ok:false,error:"non-permanent-redirect"};
      if(new URL(next).protocol!=="https:")
        return {source,expected,hops,ok:false,error:"insecure-redirect-target"};
      url=next;
      continue;
    }
    hops.push({url,status});
    // The first response MUST be 301/308. All successful cases terminate
    // at their exact HTTPS apex URL including query parameters.
    const ok=status===200&&url===expected&&hops.length>=2;
    return {source,expected,hops,ok,error:ok?null:"wrong-final-url-or-status"};
  }
  return {source,expected,hops,ok:false,error:"too-many-redirects"};
}

export async function inspectAllRedirects(fetchFn=fetch,cases=CASES){
  const results=[];
  for(const [source,expected] of cases)
    results.push(await inspectRedirectChain(source,expected,fetchFn));
  return {checked:results.length,passed:results.every(x=>x.ok),
    failures:results.filter(x=>!x.ok),results};
}

if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  const report=await inspectAllRedirects();
  for(const entry of report.results){
    console.log("EDGE_LIVE_PROOF "+JSON.stringify(entry));
  }
  console.log("EDGE_LIVE_SUMMARY "+JSON.stringify({
    checked:report.checked,passed:report.passed,failures:report.failures.length
  }));
  if(!report.passed)process.exitCode=1;
}
