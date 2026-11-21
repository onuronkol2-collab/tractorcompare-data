import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {TRACTOR_LEARNING_CASES} from "../src/lib/tractor-learning-cases.ts";

// Eight new locales are unreviewed draft data, NEVER a translation release.
const locales=["zh","hi","pt-br","fr","de","ru","ja","es"];
const ids=TRACTOR_LEARNING_CASES.map(row=>row.id).sort();
const fields=["title","situation","explanation","remember"].sort();
const sourceHashes=new Set();

for(const locale of locales){
 test("private "+locale+" learning-case draft stays complete and unapproved",()=>{
  const doc=JSON.parse(readFileSync(new URL("../src/lib/education-draft-translations/"+locale+".json",import.meta.url),"utf8"));
  sourceHashes.add(doc.sourceHash);
  assert.equal(doc.locale,locale);
  assert.equal(doc.state,"draft-needs-editorial-review");
  assert.equal(doc.validation.reviewed,false);
  assert.equal(doc.validation.complete,false);
  assert.equal(doc.summary.cases,5);
  assert.match(doc.editorialDraftProvenance?.cases||"",/independent native-language technical review required/);
  const cases=doc.data.cases;
  assert.deepEqual(Object.keys(cases).sort(),ids);
  let localized=0;
  for(const row of TRACTOR_LEARNING_CASES){
   const translated=cases[row.id];
   assert.deepEqual(Object.keys(translated).sort(),fields);
   for(const key of fields){
    const txt=translated[key];
    assert.ok(typeof txt==="string"&&txt.trim().length>=(locale==="zh"?8:18),locale+"/"+row.id+"/"+key+" empty");
    assert.notEqual(txt.trim(),row[key].en.trim(),"English fallback: "+locale+"/"+row.id+"/"+key);
    localized++;
   }
  }
  assert.equal(localized,20);
  const lift=Object.values(cases["lift-rating-versus-implement"]).join(" ");
  assert.match(lift,/3,000/,"Keep the original 3,000 kg magnitude pending number-format editorial review");
  assert.match(lift,/610 mm/,"Keep the 610 mm reference");
  const pto=Object.values(cases["economy-pto"]).join(" ");
  assert.match(pto,/540E/);
  assert.match(pto,/540 rpm/);
  const script={
   zh:/[\u4e00-\u9fff]/,hi:/[\u0900-\u097f]/,ru:/[\u0400-\u052f]/,ja:/[\u3040-\u30ff\u4e00-\u9fff]/
  }[locale];
  if(script)assert.ok(Object.values(cases).every(c=>Object.values(c).every(x=>script.test(x))),
    "Target language script missing in "+locale);
 });
}
test("all locale draft cases are sourced from the same original revision",()=>{
 assert.equal(sourceHashes.size,1);
});
