import test from "node:test";
import assert from "node:assert/strict";
import {forumBlockInsertion} from "../src/lib/forum-writing-tools.mjs";
import {forumBlocks} from "../src/lib/forum-format.mjs";
import {FORUM_WRITING_COPY} from "../src/lib/forum-editor-i18n.ts";
test("headings preserve selected content and table insertion preserves surrounding text",()=>{
 const labels=FORUM_WRITING_COPY.tr;
 const source="Önce başlık sonra";
 const edit=forumBlockInsertion(source,5,11,"heading",labels,12000);
 const actual=source.slice(0,5)+edit.replacement+source.slice(11);
 assert.equal(actual.slice(edit.selectionStart,edit.selectionEnd),"başlık");
 assert.equal(forumBlocks(actual).find(b=>b.type==="heading").lines[0],"başlık");
 const table=forumBlockInsertion("Önce\n\nSonra",7,7,"table",labels,12000);
 assert.equal(forumBlocks(table.replacement).find(b=>b.type==="table").header.length,2);
 assert.equal(forumBlockInsertion("selected",0,8,"table",labels,12000),null);
 assert.equal(forumBlockInsertion("a\nb",0,3,"heading",labels,12000),null);
 assert.equal(forumBlockInsertion("abc",3,3,"table",labels,4),null);
});
test("all ten localized controls render valid safe table templates",()=>{
 assert.equal(Object.keys(FORUM_WRITING_COPY).length,10);
 for(const labels of Object.values(FORUM_WRITING_COPY)){
  assert.ok(Object.values(labels).every(x=>typeof x==="string"&&x.trim()));
  const table=forumBlockInsertion("",0,0,"table",labels,12000);
  const block=forumBlocks(table.replacement)[0];
  assert.equal(block.type,"table");assert.equal(block.rows.length,1);
 }
});
