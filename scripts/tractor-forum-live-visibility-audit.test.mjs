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
const reply={id:"92b8ec33-ccbe-45a2-8bc8-3fd6b3b92a11",topic_id:topic.topic_id,
 locale:"tr",original_locale:"tr",status:"published",body:"Gerçek kullanıcı yanıtı",
 machine_translated:false,created_at:"2026-11-21T15:13:25Z"};
const photo={id:"b1a848cc-c3b8-4510-8c4b-1a9a0f9b83e2",topic_id:topic.topic_id,reply_id:null,
 position:1,alt_text:"Traktörün iş sahasındaki görüntüsü",locale:"und",status:"published",
 created_at:"2026-11-21T15:13:25Z"};
const now=new Date("2026-11-21T16:25:25Z");
const origin="https://tractorvs.com";
const link=origin+"/tr/forum/"+topic.slug+"/",hub=origin+"/tr/forum/";
const response=(body,ct="text/html")=>new Response(body,{status:200,headers:{"content-type":ct}});
function mock({rows=[topic],replies=[],photos=[],site=true,hidden=false,wrongCanonical=false,replyLive=true,photoLive=true}={}){
 const calls=[];
 const fetchFn=async url=>{
  const u=new URL(url);calls.push(u.toString());
  if(u.hostname.endsWith(".supabase.co")){
   const all=u.pathname.endsWith("tc_forum_localized_topics")?rows:
    u.pathname.endsWith("tc_forum_localized_replies")?replies:photos;
   return new Response(JSON.stringify(all),{status:200,headers:{
    "content-range":all.length?"0-"+(all.length-1)+"/"+all.length:"*/0"
   }});
  }
  if(u.pathname==="/forum-sitemap.xml"){
   const includesIndexable=rows.some(x=>x.seo_ready===true);
   const sitemap=hidden?link:site&&includesIndexable?link:"";
   return response('<?xml version="1.0"?><urlset><url><loc>'+hub+'</loc></url>'+
    (sitemap?'<url><loc>'+sitemap+'</loc></url>':"")+"</urlset>","application/xml");
  }
  if(u.pathname==="/tr/forum/")return response(site?'<a href="'+link.replace(origin,"")+'">Topic</a>':"<p>No public discussions</p>");
  if(u.toString()===link)return site?response('<html><head><link rel="canonical" href="'+(wrongCanonical?hub:link)+
   '"><meta name="robots" content="'+(rows[0]?.seo_ready?"index,follow,max-image-preview:large":"noindex,nofollow")+
   '"></head><h1>2026 Topic</h1>'+
   (replyLive?replies.map(x=>'<article id="reply-'+x.id+'"></article>').join(""):"")+
   (photoLive?photos.map(x=>'<img src="/forum-media?id='+x.id+'">').join(""):"")+
   '</html>'):new Response("Not Found",{status:404});
  throw Error("Unexpected request: "+url);
 };
 return {calls,fetchFn};
}
test("healthy indexed topic has sitemap, listing, canonical and public article",async()=>{
 const m=mock();
 const result=await auditForumVisibility({jwt:anon,fetchFn:m.fetchFn,now});
 assert.equal(result.ok,true);assert.equal(result.checked,1);
 assert.equal(m.calls.filter(s=>s.includes("supabase.co")).length,3);
});
test("new post does not trigger a false alarm inside 45-minute delivery grace",async()=>{
 const result=await auditForumVisibility({jwt:anon,fetchFn:mock({site:false}).fetchFn,
  now:new Date("2026-11-21T15:20:00Z")});
 assert.equal(result.ok,true);assert.equal(result.checked,0);assert.equal(result.not_yet_due,1);
});
test("missing mature topic fails on sitemap, hub and direct page",async()=>{
 const result=await auditForumVisibility({jwt:anon,fetchFn:mock({site:false}).fetchFn,now});
 assert.equal(result.ok,false);assert.match(result.errors.join("\n"),/Missing sitemap URL/);
 assert.match(result.errors.join("\n"),/not publicly reachable/);
});
test("short public topics must still appear on site, but not in SEO sitemap",async()=>{
 const short={...topic,body:"Gerçek ama kısa kullanıcı soru metni örneği.",seo_ready:false};
 const result=await auditForumVisibility({jwt:anon,fetchFn:mock({rows:[short]}).fetchFn,now});
 assert.equal(result.ok,true);assert.equal(result.indexable_topics,0);assert.equal(result.checked,1);
});
test("approved replies and images must appear in the live thread",async()=>{
 const okay=await auditForumVisibility({jwt:anon,fetchFn:mock({replies:[reply],photos:[photo]}).fetchFn,now});
 assert.equal(okay.ok,true);assert.equal(okay.checked_replies,1);assert.equal(okay.checked_photos,1);
 const bad=await auditForumVisibility({jwt:anon,fetchFn:mock({
  replies:[reply],photos:[photo],replyLive:false,photoLive:false
 }).fetchFn,now});
 assert.equal(bad.ok,false);
 assert.match(bad.errors.join("\n"),/Published reply missing/);
 assert.match(bad.errors.join("\n"),/Published photo missing/);
});
test("hidden or non-indexable sitemap URLs and wrong canonical are errors",async()=>{
 const hidden=await auditForumVisibility({jwt:anon,fetchFn:mock({rows:[],hidden:true}).fetchFn,now});
 assert.equal(hidden.ok,false);assert.match(hidden.errors[0],/Non-indexable or hidden/);
 const bad=await auditForumVisibility({jwt:anon,fetchFn:mock({wrongCanonical:true}).fetchFn,now});
 assert.equal(bad.ok,false);assert.match(bad.errors.join("\n"),/canonical/);
});
test("privileged tokens and unknown external hosts cannot be audited",async()=>{
 await assert.rejects(auditForumVisibility({jwt:anon,origin:"https://not-tractorvs.com",fetchFn:mock().fetchFn}),/approved/);
 const service="a."+Buffer.from(JSON.stringify({role:"service_role"})).toString("base64url")+".c";
 await assert.rejects(auditForumVisibility({jwt:service,fetchFn:mock().fetchFn}),/Non-anonymous/);
});
