/**
 * Read-only production smoke test for forum UI released by PR #414/#422.
 * Runs on existing watchdog schedule/manual trigger, never on a main push:
 * Cloudflare Builds can legitimately trail a GitHub merge.
 * No member credentials, Supabase writes, analytics or paid requests.
 */
import {appendFileSync} from "node:fs";
import {resolve} from "node:path";
import {fileURLToPath} from "node:url";

export const FORUM_PATHS=[
 "/forum/","/tr/forum/","/de/forum/","/fr/forum/","/es/forum/",
 "/pt-br/forum/","/ru/forum/","/ja/forum/","/zh/forum/","/hi/forum/"
];
export const ORIGIN="https://tractorvs.com";

function hasClass(html,name){
 const tags=html.match(/<[^>]+>/g)||[];
 return tags.some(tag=>{
  const cls=tag.match(/\bclass\s*=\s*(["'])(.*?)\1/i);
  return Boolean(cls&&cls[2].split(/\s+/).includes(name));
 });
}
const hasAttr=(html,name)=>new RegExp("\\s"+name+"(?:\\s|=|>)","i").test(html);

export function inspectForumUiHtml(html){
 const errors=[];
 if(typeof html!=="string"||!html.trim())return ["HTML is empty"];
 for(const name of ["community-hero-inner","community-content-grid","community-topic-grid"])
  if(!hasClass(html,name))errors.push("Missing forum layout: "+name);
 if(!hasAttr(html,"data-recent-members"))errors.push("Newest members section missing");
 if(!hasAttr(html,"data-forum-auth-gate"))errors.push("Guest account panel missing");
 const inputs=(html.match(/<input\b[^>]*>/gi)||[]).filter(tag=>/\bname\s*=\s*(["'])show_leaderboard\1/i.test(tag));
 if(inputs.length!==1)errors.push("Expected exactly one member visibility opt-in checkbox");
 else {
  if(!/\btype\s*=\s*(["'])checkbox\1/i.test(inputs[0]))
   errors.push("Member visibility opt-in is not a checkbox");
  // checked="false" is still checked in HTML: reject any checked attribute.
  if(/\schecked(?:\s|=|\/?>)/i.test(inputs[0]))
   errors.push("Member visibility opt-in is checked by default");
 }
 return errors;
}

export async function auditLiveForumUi({fetchFn=fetch,origin=ORIGIN,paths=FORUM_PATHS}={}){
 if(origin!==ORIGIN)throw Error("External origin is not allowed");
 const errors=[];
 let checked=0;
 for(let i=0;i<paths.length;i+=2){
  const batch=paths.slice(i,i+2);
  await Promise.all(batch.map(async path=>{
   if(!FORUM_PATHS.includes(path)){errors.push("Unapproved path");return;}
   const url=origin+path;
   try{
    const response=await fetchFn(url,{
     headers:{"Accept":"text/html","User-Agent":"TractorVS-forum-live-ui-audit/1.0"},
     cache:"no-store",signal:AbortSignal.timeout(15000)
    });
    if(!response.ok)throw Error("HTTP "+response.status);
    if(response.url&&new URL(response.url).origin!==origin)throw Error("External redirect");
    if(!(response.headers.get("content-type")||"").toLowerCase().includes("text/html"))
     throw Error("Non-HTML response");
    const html=await response.text();
    checked++;
    for(const issue of inspectForumUiHtml(html))errors.push(path+": "+issue);
   }catch(e){errors.push(path+": "+String(e instanceof Error?e.message:e));}
  }));
 }
 return {ok:errors.length===0,checked,total:paths.length,errors};
}

if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const result=await auditLiveForumUi();
 console.log("TRACTORVS_LIVE_FORUM_UI "+JSON.stringify(result));
 if(process.env.GITHUB_STEP_SUMMARY)appendFileSync(process.env.GITHUB_STEP_SUMMARY,
  "## Live forum UI + opt-in privacy\n\n"+(result.ok?"PASS":"FAIL")+
  " — "+result.checked+"/"+result.total+" forum locales checked.\n\n"+
  (result.errors.length?result.errors.map(x=>"- "+x).join("\n"):"No forum HTML drift found.")+"\n");
 if(!result.ok)process.exitCode=1;
}
