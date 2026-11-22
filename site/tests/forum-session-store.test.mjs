import test from "node:test";
import assert from "node:assert/strict";
import {FORUM_SESSION_KEY,FORUM_ACCESS_KEY,FORUM_REFRESH_KEY,SESSION_MAX_AGE_MS,
 readForumSession,rememberForumSession,clearForumSession,isForumRemembered}
 from "../src/lib/forum-session-store.mjs";

function mockStorage(){
 const items=new Map();
 let writes=0;
 return {
  get writes(){return writes},
  getItem(key){return items.has(key)?items.get(key):null},
  setItem(key,val){writes++;items.set(key,String(val))},
  removeItem(key){items.delete(key)},
  clear(){items.clear()},
  get length(){return items.size}
 };
}
function setup(){
 const localStorage=mockStorage(),sessionStorage=mockStorage();
 globalThis.window={localStorage,sessionStorage};
 return {localStorage,sessionStorage};
}
test.afterEach(()=>{delete globalThis.window});

test("remembered login survives a closed browser tab but session-only login does not",()=>{
 const {localStorage,sessionStorage}=setup();
 assert.equal(rememberForumSession("access-1","refresh-1",true),true);
 assert.equal(isForumRemembered(),true);
 assert.deepEqual(readForumSession(),{access:"access-1",refresh:"refresh-1",remember:true});
 sessionStorage.clear();
 assert.equal(readForumSession()?.access,"access-1");
 assert.equal(localStorage.getItem(FORUM_SESSION_KEY)?.includes("password"),false);
 rememberForumSession("access-2","refresh-2",false);
 assert.equal(localStorage.getItem(FORUM_SESSION_KEY),null);
 sessionStorage.clear();
 assert.equal(readForumSession(),null);
});
test("sign out removes access and refresh tokens from both browser stores",()=>{
 const {localStorage,sessionStorage}=setup();
 rememberForumSession("access","refresh",true);
 clearForumSession();
 assert.equal(localStorage.getItem(FORUM_SESSION_KEY),null);
 assert.equal(sessionStorage.getItem(FORUM_ACCESS_KEY),null);
 assert.equal(sessionStorage.getItem(FORUM_REFRESH_KEY),null);
 assert.equal(readForumSession(),null);
});
test("expired or malformed durable sessions fail closed without preserving secrets",()=>{
 const {localStorage}=setup();
 localStorage.setItem(FORUM_SESSION_KEY,JSON.stringify({v:2,access:"a",refresh:"r",until:Date.now()-1}));
 assert.equal(readForumSession(),null);
 assert.equal(localStorage.getItem(FORUM_SESSION_KEY),null);
 localStorage.setItem(FORUM_SESSION_KEY,"not-json");
 assert.equal(readForumSession(),null);
 localStorage.setItem(FORUM_SESSION_KEY,JSON.stringify({v:2,access:"a",refresh:"r",
  until:Date.now()+SESSION_MAX_AGE_MS+100000}));
 assert.equal(readForumSession(),null);
});
test("refresh replaces the durable access and refresh pair, never adds user data",()=>{
 const {localStorage}=setup();
 rememberForumSession("old-access","old-refresh",true);
 rememberForumSession("new-access","new-refresh",true);
 const stored=JSON.parse(localStorage.getItem(FORUM_SESSION_KEY));
 assert.deepEqual(Object.keys(stored).sort(),["access","refresh","until","v"]);
 assert.equal(stored.access,"new-access");
 assert.equal(stored.refresh,"new-refresh");
 assert.ok(stored.until>Date.now());
});

test("two open tabs never re-write an unchanged remembered token and amplify auth calls",()=>{
 const {localStorage,sessionStorage}=setup();
 rememberForumSession("access","refresh",true);
 const writes=localStorage.writes;
 sessionStorage.clear();
 for(let i=0;i<10;i++){
  const saved=readForumSession();
  rememberForumSession(saved.access,saved.refresh,saved.remember);
 }
 assert.equal(localStorage.writes,writes,"No re-verification writes should be broadcast to sibling tabs");
 rememberForumSession("rotated","rotated-refresh",true);
 assert.equal(localStorage.writes,writes+1,"Only an actual rotated session is broadcast");
});
