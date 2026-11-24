// Direct HTTP evidence, not a scraper's cleaned HTML. No paid API or database.
import {fileURLToPath} from "node:url";
import {resolve} from "node:path";
const ORIGIN="https://tractorvs.com";
const ROUTES=["/zh/","/ja/"];
const SIZES="auto, (max-width:620px) min(calc(100vw - 88px), 508px), (max-width:720px) 219px, (max-width:800px) calc(50vw - 85px), min(calc(33.333vw - 80px), 323px)";
const attribute=(tag,name)=>new RegExp('(?:^|\\s)'+name+'="([^"]*)"','i').exec(tag)?.[1];
export function checkHomePhotos(html,path){
  const release=[...html.matchAll(/<meta\b[^>]*>/gi)].find(m=>attribute(m[0],"name")==="tractorvs-release-sha");
  const sha=release&&attribute(release[0],"content");
  if(!/^[a-f0-9]{40}$/.test(sha||""))throw Error("Missing real release SHA: "+path);
  const canonical=[...html.matchAll(/<link\b[^>]*>/gi)].find(m=>attribute(m[0],"rel")==="canonical");
  if(!canonical||attribute(canonical[0],"href")!==ORIGIN+path)throw Error("Wrong canonical: "+path);
  const results=[];
  for(const card of html.matchAll(/<article\b[^>]*class="home-featured-card"[^>]*>[\s\S]*?<\/article>/gi)){
    const body=card[0];
    const button=[...body.matchAll(/<button\b[^>]*>/gi)].find(m=>attribute(m[0],"data-photo-url"));
    if(!button)continue;
    const image=/<img\b[^>]*>/i.exec(body)?.[0];
    const src=image&&attribute(image,"src");
    const match=/^\/images\/tractors\/([a-z0-9-]+)-480\.jpg$/.exec(src||"");
    if(!match)throw Error("Unexpected home photo source: "+path);
    const stem="/images/tractors/"+match[1];
    const srcset=attribute(image,"srcset")||"";
    const sizes=attribute(image,"sizes");
    if(!srcset.includes(stem+"-480.jpg 480w")||!srcset.includes(stem+"-960.jpg 960w")||sizes!==SIZES)
      throw Error("Missing responsive home photo markup: "+path+" "+stem);
    if(attribute(image,"loading")!=="lazy"||!attribute(image,"alt")||!attribute(image,"width")||!attribute(image,"height"))
      throw Error("Missing photo dimensions, lazy loading or alt: "+path);
    if(attribute(button[0],"data-photo-url")!==stem+"-1920.jpg"||
       !attribute(button[0],"data-photo-source")||!attribute(button[0],"data-photo-credit")||!attribute(button[0],"data-photo-license"))
      throw Error("Missing full-size photo or credit: "+path);
    results.push({fileId:match[1],srcset,sizes});
  }
  if(!html.includes('data-research-gallery="licensed"'))throw Error("Missing licensed featured gallery: "+path);
  return {path,sha,photos:results};
}
export async function auditLiveHomePhotos({fetchFn=fetch}={}){
  const results=[];
  for(const path of ROUTES){
    const response=await fetchFn(ORIGIN+path,{redirect:"error",signal:AbortSignal.timeout(20000),headers:{"Accept":"text/html"}});
    if(response.status!==200||!(response.headers.get("content-type")||"").startsWith("text/html"))
      throw Error("Unexpected live homepage response: "+path+" "+response.status);
    const result=checkHomePhotos(await response.text(),path);
    results.push(result);
    console.log("TRACTORVS_LIVE_HOME_PHOTOS "+JSON.stringify(result));
  }
  if(new Set(results.map(r=>r.sha)).size!==1)throw Error("Mixed production versions; cannot certify a single release");
  if(!results.some(r=>r.photos.length>0))throw Error("No actual featured photo in the sample; no responsive proof");
  return results;
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  try{await auditLiveHomePhotos();}catch(error){console.error(error.message);process.exitCode=1;}
}
