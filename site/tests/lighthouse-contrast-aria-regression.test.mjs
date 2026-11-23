import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";

const read=(f)=>readFileSync(new URL("../src/"+f,import.meta.url),"utf8");
const home=read("styles/home-experience.css");
const forum=read("styles/forum-readable.css");
const hub=read("components/ForumHub.astro");

function luminance(hex) {
 const parts=hex.replace("#","").match(/.{2}/g).map(h=>{
  const s=parseInt(h,16)/255;
  return s<=0.04045?s/12.92:((s+0.055)/1.055)**2.4;
 });
 return 0.2126*parts[0]+0.7152*parts[1]+0.0722*parts[2];
}
function contrast(a,b) {
 const x=luminance(a),y=luminance(b);
 return (Math.max(x,y)+0.05)/(Math.min(x,y)+0.05);
}
test("photo credits override site-wide colored links without modifying photograph rights",()=>{
 assert.match(home,/#main \.home-featured-card \.tractor-photo-short-credit a \{color:#d8efc5;/);
 assert.ok(contrast("#d8efc5","#19271f")>=4.5);
 assert.ok(contrast("#2c6743","#19271f")<4.5,"existing dark green is a measured regression");
 const photos=read("components/TractorPhoto.astro");
 assert.match(photos,/href=\{photo\.sourcePage\}/);
 assert.match(photos,/href=\{photo\.licenseUrl\}/);
});
test("forum metadata timestamps and responsive labels meet AA on white cards",()=>{
 assert.match(forum,/#main \.community-shell \.community-topic-meta time\{color:#48634f\}/);
 assert.match(forum,/#main \.community-shell \.community-topic \.community-topic-mobile-label\{[^}]*color:#48634f\}/);
 assert.ok(contrast("#48634f","#ffffff")>=4.5);
 assert.ok(contrast("#6c7d70","#ffffff")<4.5);
 assert.ok(contrast("#708074","#ffffff")<4.5);
});
test("forum article cards use native article semantics, never forbidden listitem role",()=>{
 assert.match(hub,/<div class="community-topic-grid" id="forum-topic-list">/);
 assert.match(hub,/<article class="community-topic" data-forum-topic/);
 assert.doesNotMatch(hub,/<article class="community-topic"[^>]*role="listitem"/);
 assert.doesNotMatch(hub,/id="forum-topic-list" role="list"/);
 assert.match(hub,/<h3><a href=\{path\+topic\.slug\+"\/"\}>/);
 assert.match(hub,/data-forum-search=/);
});
test("readability overrides stay scoped; no global theming or fragile magic numbers",()=>{
 assert.ok(home.includes("#main .home-featured-card"));
 assert.ok(forum.includes("#main .community-shell"));
 assert.doesNotMatch(home+forum,/!important/);
});
