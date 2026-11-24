import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {stripTypeScriptTypes} from "node:module";
import vm from "node:vm";
const read=path=>readFileSync(new URL("../src/"+path,import.meta.url),"utf8");
const hub=read("components/ForumHub.astro");
const live=read("lib/forum-live-client.ts");
test("forum sorting preserves existing order and only reparents when real rank changes",()=>{
 const older={dataset:{forumReplyCount:"4",forumPublishedAt:"2026-11-21T00:00:00Z"}};
 const newer={dataset:{forumReplyCount:"1",forumPublishedAt:"2026-11-22T00:00:00Z"}};
 let rows=[newer,older],writes=0;
 const grid={querySelectorAll:()=>rows.slice(),append(row){writes++;rows=rows.filter(x=>x!==row);rows.push(row)}};
 const document={querySelectorAll:()=>[grid]};
 const script=hub.slice(hub.indexOf(" const sortPublicRows="),hub.indexOf(" const updatePublicCounts="));
 const context=vm.createContext({document,view:"latest",replyCount:el=>Number(el.dataset.forumReplyCount),publishedAt:el=>Date.parse(el.dataset.forumPublishedAt)});
 vm.runInContext(stripTypeScriptTypes(script+"\nsortPublicRows();"),context);
 assert.equal(writes,0);
 context.view="popular";vm.runInContext("sortPublicRows();",context);
 assert.deepEqual(rows,[older,newer]);assert.equal(writes,2);
 vm.runInContext("sortPublicRows();",context);assert.equal(writes,2);
 context.view="latest";vm.runInContext("sortPublicRows();",context);
 assert.deepEqual(rows,[newer,older]);
});
test("unchanged forum filter values do not trigger repeated writes",()=>{
 const fragment=hub.slice(hub.indexOf(" const setText="),hub.indexOf(" const replyCount="));
 const helpers=vm.runInNewContext(stripTypeScriptTypes(fragment+"\n({setText,setHidden,setPressed});"));
 let writes=0,hidden=false,content="3",active=true,pressed="true";
 const el={get hidden(){return hidden},set hidden(v){writes++;hidden=v},get textContent(){return content},set textContent(v){writes++;content=v}};
 const button={classList:{contains:()=>active,toggle(k,v){writes++;active=v}},getAttribute:()=>pressed,setAttribute(k,v){writes++;pressed=v}};
 helpers.setText(el,"3");helpers.setHidden(el,false);helpers.setPressed(button,true);assert.equal(writes,0);
 helpers.setText(el,"4");helpers.setHidden(el,true);helpers.setPressed(button,false);assert.equal(writes,4);
 helpers.setText(el,"4");helpers.setHidden(el,true);helpers.setPressed(button,false);assert.equal(writes,4);
 assert.match(hub,/updatePublicCounts\(items\)/);
});
test("live refresh preserves previously approved live topics, excludes static duplicates, and handles removals",async()=>{
 class El{
  constructor(){this.dataset={};this.children=[];this.hidden=false;this.textContent=""}
  append(...children){this.children.push(...children)}
  replaceChildren(...children){this.children=children.flatMap(x=>x.fragment?x.children:[x])}
  contains(node){return this.children.includes(node)}
 }
 const root=new El(),grid=new El(),status=new El(),heading=new El(),staticCard=new El();
 const id1="11111111-1111-4111-8111-111111111111",id2="22222222-2222-4222-8222-222222222222",id3="33333333-3333-4333-8333-333333333333";
 staticCard.dataset.forumTopicId=id1;
 root.dataset.forumLiveConfig=JSON.stringify({url:"https://example.supabase.co",key:"public-fixture",lang:"en"});
 root.querySelector=key=>({"[data-forum-live-grid]":grid,"[data-forum-live-status]":status,"[data-forum-live-heading]":heading}[key]);
 const listeners={},events=[];
 const document={createElement:tag=>Object.assign(new El(),{tag}),createDocumentFragment(){const el=new El();el.fragment=true;return el},querySelectorAll:()=>[staticCard,...grid.children],querySelector:()=>null,addEventListener(name,fn){listeners[name]=fn},dispatchEvent(e){events.push(e.type)}};
 const row=(topic_id,extra={})=>({id:topic_id,topic_id,locale:"en",original_locale:"en",status:"published",slug:"approved-forum-topic",category:"questions",created_at:"2026-11-22T12:00:00Z",title:"A sufficiently long approved title",body:"A sufficiently long approved forum message with real content.",machine_translated:false,...extra});
 let response=[row(id1),row(id2),row(id2),row(id3,{status:"draft"})];
 const context={document,URLSearchParams,Intl,Date,AbortSignal,Event,location:{search:""},FORUM_LIVE_TEXT:{en:{pending:"loading",failed:"failed",read:"read",summary:"summary"}},forumBlocks:()=>[],forumSeoDescription:body=>body,forumSearchText:s=>s.toLowerCase(),fetch:async()=>({ok:true,json:async()=>response})};
 const script=live.slice(live.indexOf("type PubRow=")).replace("export function initForumLive","function initForumLive");
 vm.runInNewContext(stripTypeScriptTypes(script+"\ninitForumLive(root);"),{...context,root});
 const tick=()=>new Promise(resolve=>setImmediate(resolve));
 await tick();
 assert.equal(grid.children.length,1);assert.equal(grid.children[0].dataset.forumTopicId,id2);
 assert.equal(grid.children[0].dataset.forumPublishedAt,"2026-11-22T12:00:00Z");
 const [meta,details,excerpt]=grid.children[0].children;
 assert.equal(details.tag,"details");
 assert.equal(details.children[0].tag,"summary");
 assert.equal(details.children[0].children[0].tag,"h3");
 assert.equal(details.children[0].children[0].textContent,"A sufficiently long approved title");
 assert.equal(details.children[0].children[0].children[0].textContent,"read");
 assert.equal(details.children[2].className,"forum-live-body");
 assert.equal(excerpt.tag,"p");
 assert.equal(meta.className,"forum-live-meta");
 assert.equal(grid.children[0].dataset.forumReplyCount,undefined,"No invented live reply count");
 listeners["tractorvs-forum-topic-saved"]();await tick();
 assert.equal(grid.children.length,1);assert.equal(grid.children[0].dataset.forumTopicId,id2);
 response=[row(id1),row(id3)];listeners["tractorvs-forum-topic-saved"]();await tick();
 assert.equal(grid.children.length,1);assert.equal(grid.children[0].dataset.forumTopicId,id3);
 response=[row(id1)];listeners["tractorvs-forum-topic-saved"]();await tick();
 assert.equal(grid.children.length,0);assert.equal(root.hidden,true);
 assert.equal(events.length,4);
});
