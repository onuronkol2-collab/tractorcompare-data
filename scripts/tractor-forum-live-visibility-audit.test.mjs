import {test} from "node:test";
import assert from "node:assert/strict";
import {auditForumVisibility} from "./tractor-forum-live-visibility-audit.mjs";
const anon="a."+Buffer.from(JSON.stringify({role:"anon"})).toString("base64url")+".c";
const topic={
 id:"713ab252-a925-4ab7-b2c8-a30ce5b86706",
 topic_id:"713ab252-a925-4ab7-b2c8-a30ce5b86706",
 locale:"tr",original_locale:"tr",slug:"2026-traktor-bayi-memnuniyeti-siralamasi-713ab252a9254ab7b2c8a30ce5b86706",
 title:"2026 Traktör Bayi Memnuniyeti Sıralaması",
 body:"Özgün ve doğrulanmış 2026 araştırma metni. ".repeat(8),
 status:"published",seo_ready:true,machine_translated:false,
 created_at:"2026-11-21T15:13:25Z",updated_at:"2026-11-21T15:13:25Z"
};
const now=new Date("2026-11-21T16:25:25Z");
const origin="https://tractorvs.com";
const link=origin+"/tr/forum/"+topic.slug+"/";
const hub=origin+"/tr/forum/";
const response=(body,ct="text/html")=>new Response(body,{status:200,headers:{"content-type":ct}});
function mock({rows=[topic],site=true,hidden=false,wrongCanonical=false}={}){
 const calls=[];
 const fetchFn=async url=>{
  const u=new URL(url);calls.push(u.toString());
  if(u.hostname.endsWith(".supabase.co")){
   return new Response(JSON.stringify(rows),{status:200,headers:{"content-range":rows.length?"0-"+(rows.length-1)+"/"+rows.length:"*/0"}});
  }
  if(u.pathname==="/forum-sitemap.xml"){
   const sitemap=hidden?link:site?link:"";
   return response('<?xml version="1.0"?><urlset><url><loc>'+hub+'</loc></url>'+
    (sitemap?'<url><loc>'+sitemap+'</loc></url>':"")+"</urlset>","application/xml");
  }
  if(u.pathname==="/tr/forum/")return response(site?'<a href="'+link.replace(origin,"")+'">Topic</a>':"<p>No public discussions</p>");
  if(u.toString()===link)return site?response('<html><head><link rel="canonical" href="'+(wrongCanonical?hub:link)+'"><meta name="robots" content="index,follow,max-image-preview:large"></head><h1>2026 Topic</h1></html>'):new Response("Not Found",{status:404});
  throw Error("Unexpected request: "+url);
 };
 return {calls,fetchFn};
}
test("healthy live post has sitemap, listing, canonical and indexable article",async()=>{
 const m=mock();
 const result=await auditForumVisibility({jwt:anon,fetchFn:m.fetchFn,now});
 assert.equal(result.ok,true);assert.equal(result.checked,1);
 assert.equal(m.calls.filter(s=>s.includes("supabase.co")).length,1);
});
test("recent insert is not marked late before the 45-minute delivery window",async()=>{
 const m=mock({site:false});
 const result=await auditForumVisibility({jwt:anon,fetchFn:m.fetchFn,now:new Date("2026-11-21T15:20:00Z")});
 assert.equal(result.ok,true);assert.equal(result.checked,0);assert.equal(result.not_yet_due,1);
});
test("missing live post after the grace window fails loudly instead of reporting success",async()=>{
 const result=await auditForumVisibility({jwt:anon,fetchFn:mock({site:false}).fetchFn,now});
 assert.equal(result.ok,false);assert.match(result.errors.join("\n"),/Missing sitemap URL/);
 assert.match(result.errors.join("\n"),/not publicly reachable/);
});
test("stale hidden content in sitemap and wrong SEO canonical are failures",async()=>{
 const m=mock({rows:[],hidden:true});
 const result=await auditForumVisibility({jwt:anon,fetchFn:m.fetchFn,now});
 assert.equal(result.ok,false);assert.match(result.errors[0],/Hidden\/unapproved/);
 const bad=await auditForumVisibility({jwt:anon,fetchFn:mock({wrongCanonical:true}).fetchFn,now});
 assert.equal(bad.ok,false);assert.match(bad.errors.join("\n"),/canonical/);
});
test("audit forbids privileged tokens and unapproved hosts",async()=>{
 await assert.rejects(auditForumVisibility({jwt:anon,origin:"https://not-tractorvs.com",fetchFn:mock().fetchFn}),/approved/);
 const service="a."+Buffer.from(JSON.stringify({role:"service_role"})).toString("base64url")+".c";
 await assert.rejects(auditForumVisibility({jwt:service,fetchFn:mock().fetchFn}),/Non-anonymous/);
});
