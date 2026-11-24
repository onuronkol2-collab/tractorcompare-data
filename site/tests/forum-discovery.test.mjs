import test from "node:test";
import assert from "node:assert/strict";
import {forumBlocks} from "../src/lib/forum-format.mjs";
import {forumSearchTerms,matchesForumTerms,forumActivityByTopic,latestForumActivity,relatedForumTopics,forumSpreadsheetMarkdown} from "../src/lib/forum-discovery.mjs";

test("multi-term search tolerates order and Turkish accent differences without changing Hindi vowels",()=>{
 const terms=forumSearchTerms("  ŞANZIMAN   New  holland şanzıman ","tr");
 assert.deepEqual(terms,["sanziman","new","holland"]);
 assert.equal(matchesForumTerms("new holland hidrolik sanziman",terms),true);
 assert.equal(matchesForumTerms("new holland hidrolik",terms),false);
 assert.equal(matchesForumTerms("",forumSearchTerms(" ","tr")),true);
 assert.notEqual(forumSearchTerms("किताब","hi")[0],forumSearchTerms("कतब","hi")[0]);
 assert.ok(forumSearchTerms(Array.from({length:40},(_,i)=>"word"+i).join(" "),"en").length<=20);
});
test("last activity counts only published original replies and cannot predate topic creation",()=>{
 const reply={topic_id:"a",status:"published",locale:"tr",original_locale:"tr",machine_translated:false};
 const dates=forumActivityByTopic([
 {...reply,created_at:"2026-11-20T01:00:00Z"},
 {...reply,created_at:"2026-11-22T01:00:00Z"},
 {...reply,created_at:"2026-11-24T01:00:00Z",status:"draft"},
 {...reply,created_at:"2026-11-25T01:00:00Z",locale:"en",machine_translated:true},
 {...reply,topic_id:"b",created_at:"invalid"}
 ]);
 assert.equal(dates.get("a"),"2026-11-22T01:00:00Z");
 assert.equal(dates.has("b"),false);
 assert.equal(latestForumActivity("2026-11-23T01:00:00Z",dates.get("a")),"2026-11-23T01:00:00Z");
 assert.equal(latestForumActivity("2026-11-21T01:00:00Z",dates.get("a")),"2026-11-22T01:00:00Z");
});
test("related topics prefer identical catalog model, exclude other languages, self and private rows",()=>{
 const root={topic_id:"a",locale:"tr",status:"published",tractor_id:"model-1",category:"maintenance",created_at:"2026-11-20",slug:"topic-a"};
 const row=(id,extra={})=>({...root,topic_id:id,slug:"topic-"+id,...extra});
 const result=relatedForumTopics(root,[root,row("b",{tractor_id:null,created_at:"2026-11-24"}),row("c",{category:"reviews"}),row("d",{status:"draft"}),row("e",{locale:"en"}),row("f",{tractor_id:null,category:"news"}),row("g")]);
 assert.deepEqual(result.map(x=>x.topic_id),["g","c","b"]);
 assert.equal(relatedForumTopics(root,[root]).length,0);
 assert.equal(relatedForumTopics(root,[row("g"),row("c")],1).length,1);
});

test("spreadsheet paste preserves cells and rejects ambiguous or unsafe table formats",()=>{
 const original="Marka\tÜlke\r\nJohn Deere\tABD\r\nDeutz-Fahr\tAlmanya\r\n";
 const markdown=forumSpreadsheetMarkdown(original);
 assert.ok(markdown);
 const blocks=forumBlocks(markdown);
 assert.equal(blocks.length,1);
 assert.equal(blocks[0].type,"table");
 assert.deepEqual(blocks[0].rows.map(row=>row.map(cell=>cell.map(part=>part.text).join(""))),[["John Deere","ABD"],["Deutz-Fahr","Almanya"]]);
 for(const value of ["single line","a\tb","a\tb\nc","a\tb\nx|y\tz","a\tb\n<script>\tz","a\tb\n x\tz"])assert.equal(forumSpreadsheetMarkdown(value),null);
});
