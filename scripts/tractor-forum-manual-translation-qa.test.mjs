import {test} from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {auditManualForumTranslation} from "./tractor-forum-manual-translation-qa.mjs";
const base={
 sourceTitle:"2026 Bayi Memnuniyeti",
 targetTitle:"2026 Dealer Satisfaction",
 sourceBody:"## Sonuç\n\nSame 13,7 / 20 puan, John Deere 12,3 puan. Güç 75 hp ve 3000 kg. https://example.org/study\n\n| Sıra | Marka | Puan |\n|---|---|---|\n| 1 | Same | 13,7 |\n\n- Bayi memnuniyeti güvenilirlikle aynı değildir.",
 targetBody:"## Results\n\nSame scored 13,7 / 20, John Deere 12,3. Power is 75 hp and 3000 kg. https://example.org/study\n\n| Rank | Brand | Score |\n|---|---|---|\n| 1 | Same | 13,7 |\n\n- Dealer satisfaction is not mechanical reliability.",
 locale:"en"
};
test("manual translations must preserve numbers, physical units, headings, links, table and brands",()=>{
 assert.deepEqual(auditManualForumTranslation(base).errors,[]);
 for(const [key,value,reason] of [
  ["targetBody",base.targetBody.replace("75 hp","75 PS"),"numeric_units_changed"],
  ["targetBody",base.targetBody.replace("3000","2000"),"numeric_facts_changed"],
  ["targetBody",base.targetBody.replace("example.org","example.com"),"urls_changed"],
  ["targetBody",base.targetBody.replace("Same","Incorrect"),"brand_missing:Same"],
  ["targetBody",base.targetBody.replace("## Results","Results"),"heading_structure_changed"],
  ["targetBody",base.targetBody.replace("| 1 | Same | 13,7 |","1 Same 13,7"),"table_shape_changed"],
  ["targetBody",base.targetBody.replace("- Dealer satisfaction","Dealer satisfaction"),"list_structure_changed"]
 ]){
  const got=auditManualForumTranslation({...base,[key]:value});
  assert.ok(got.errors.some(x=>x===reason),reason);
 }
});
test("wrong alphabet never passes just because numbers match",()=>{
 const v=auditManualForumTranslation({...base,locale:"ru"});
 assert.ok(v.errors.includes("target_script_missing"));
});
test("production Edge handler has NO old provider imports or model calls",()=>{
 const body=readFileSync(new URL("../supabase/functions/tractor-forum-translate/index.ts",import.meta.url),"utf8");
 assert.match(body,/if\(input\?\.action!=="status"\)/);
 assert.match(body,/return reply\(423/);
 assert.doesNotMatch(body,/import \{.*(?:Gemini|Azure|Cloudflare).*from/);
 assert.doesNotMatch(body,/api\.cloudflare\.com|api\.cognitive\.microsofttranslator\.com|generativelanguage\.googleapis\.com/);
});
test("production workflow has no legacy TEST ONAY or active queue processor",()=>{
 const body=readFileSync(new URL("../.github/workflows/tractorvs-forum-translation.yml",import.meta.url),"utf8");
 assert.match(body,/workflow_dispatch:/);
 assert.match(body,/- KONTROL/);
 assert.doesNotMatch(body,/^\s*- (?:ONAY|TEST|TOPLU_TEST)$/m);
 assert.doesNotMatch(body,/^\s*(?:process|synthetic_test|synthetic_batch_test):/m);
});
