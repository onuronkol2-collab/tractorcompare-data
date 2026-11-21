import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync,existsSync} from "node:fs";

const layout=readFileSync(new URL("../src/layouts/SiteLayout.astro",import.meta.url),"utf8");
const ownerTag='<meta name="seznam-wmt" content="j3zomI2WVcqwWkKadjNc1pXonj4g8L7O" />';

test("Seznam verification uses the exact supplied 32-character ownership proof",()=>{
  assert.equal((layout.match(/name="seznam-wmt"/g)||[]).length,1);
  assert.ok(layout.includes(ownerTag),"Do not silently alter the webmaster token");
  assert.match(layout,/plainPath==="/" && indexingEnabled && <meta name="seznam-wmt"/,
    "Only public, indexable locale homepages carry the verification tag");
});

test("production generated homepages contain the proof when build artifacts exist",()=>{
  const root=new URL("../dist/index.html",import.meta.url);
  const tr=new URL("../dist/tr/index.html",import.meta.url);
  if(!existsSync(root)||!existsSync(tr))return; // Source regression above always runs.
  for(const url of [root,tr]){
    const html=readFileSync(url,"utf8");
    assert.match(html,/<meta\s+name="seznam-wmt"\s+content="j3zomI2WVcqwWkKadjNc1pXonj4g8L7O"/,
      "The built HTML must carry the same ownership token");
  }
});
