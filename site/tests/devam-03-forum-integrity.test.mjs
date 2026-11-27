import test from "node:test";
import assert from "node:assert/strict";
import {forumSearchText} from "../src/lib/forum-search.mjs";
import {readForumSession,isForumRemembered,clearForumSession,FORUM_ACCESS_KEY,FORUM_REFRESH_KEY} from "../src/lib/forum-session-store.mjs";
import {fetchPublicRows} from "../src/lib/forum-public-rows.mjs";

test("Latin forum searches fold accents but preserve mixed Hindi and Japanese marks",()=>{
 for(const locale of ["en","tr","de","fr","es","pt-br"]){
  assert.equal(forumSearchText("Başak कि ガ",locale),"basak कि ガ");
  assert.notEqual(forumSearchText("कि",locale),forumSearchText("क",locale));
 }
});

test("forum can fall back to a tab when durable storage reads throw",()=>{
 const original=Object.getOwnPropertyDescriptor(globalThis,"window");
 try{
  Object.defineProperty(globalThis,"window",{configurable:true,value:{
   localStorage:{getItem(){throw new Error("denied");}},
   sessionStorage:{getItem(key){return key===FORUM_ACCESS_KEY?"access":key===FORUM_REFRESH_KEY?"refresh":null;}}
  }});
  assert.deepEqual(readForumSession(),{access:"access",refresh:"refresh",remember:false});
  assert.equal(isForumRemembered(),false);
 }finally{if(original)Object.defineProperty(globalThis,"window",original);else delete globalThis.window;}
});

test("sign out attempts all token removals even if one fails",()=>{
 const original=Object.getOwnPropertyDescriptor(globalThis,"window");const removed=[];
 try{
  Object.defineProperty(globalThis,"window",{configurable:true,value:{
   localStorage:{removeItem(key){removed.push(key);}},
   sessionStorage:{removeItem(key){removed.push(key);if(key===FORUM_ACCESS_KEY)throw Error("denied");}}
  }});
  clearForumSession();
  assert.ok(removed.includes(FORUM_REFRESH_KEY));assert.equal(removed.length,3);
 }finally{if(original)Object.defineProperty(globalThis,"window",original);else delete globalThis.window;}
});

const row=(id)=>({id:String(id),locale:"tr",status:"published"});
const read=(data,range)=>fetchPublicRows({api:"https://example.com/rest/v1",table:"public_forum",fields:"id,locale,status",headers:{},fetchFn:async()=>({status:206,headers:new Headers({"content-range":range}),json:async()=>data})});
test("forum pagination refuses more rows than the declared total or page limit",async()=>{
 await assert.rejects(read([row(1),row(2)],"0-1/1"));
 await assert.rejects(read(Array.from({length:251},(_,i)=>row(i)),"0-250/251"));
 await assert.rejects(read([],"0-0/1"));
});
test("forum pagination accepts valid final pages and rejects blank identities",async()=>{
 assert.deepEqual(await read([row(1)],"0-0/1"),[row(1)]);
 assert.deepEqual(await read([],"*/0"),[]);
 await assert.rejects(read([{...row(1),id:" "}],"0-0/1"));
});
