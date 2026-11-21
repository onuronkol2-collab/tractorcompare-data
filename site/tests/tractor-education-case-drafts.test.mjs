import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {TRACTOR_LEARNING_CASES} from "../src/lib/tractor-learning-cases.ts";
import {technicalNumberRetained} from "../scripts/verify-education-translation-drafts.mjs";

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
  assert.ok(technicalNumberRetained("3,000",lift),"Preserve 3000 kg magnitude in native-language grouping");
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

test("technical integer thousands may be localized without changing their actual magnitude",()=>{
 const equivalent=["3,000 kg","3.000 kg","3 000 kg","3\u00a0000 kg","3\u202f000 kg","3000 kg"];
 for(const text of equivalent)assert.equal(technicalNumberRetained("3,000",text),true,text);
 for(const invalid of ["3,100 kg","3,001 kg","3,0 kg","300 kg","13,000 kg","3,000,000 kg"]){
  assert.equal(technicalNumberRetained("3,000",invalid),false,invalid);
 }
 assert.equal(technicalNumberRetained("540E","540E"),true);
 assert.equal(technicalNumberRetained("540E","540"),false);
 assert.equal(technicalNumberRetained("610","600 mm"),false);
 assert.equal(technicalNumberRetained("2.5","2,5"),false,
   "Other decimal measurements still require exact safety review");
 const expected={de:"3.000",fr:"3\u202f000","pt-br":"3.000",es:"3000",ru:"3\u00a0000"};
 for(const [locale,format] of Object.entries(expected)){
  const doc=JSON.parse(readFileSync(new URL("../src/lib/education-draft-translations/"+locale+".json",import.meta.url),"utf8"));
  const row=doc.data.cases["lift-rating-versus-implement"];
  assert.ok(row.title.includes(format) && row.situation.includes(format),locale+" grouping");
  assert.equal(doc.validation.complete,false);
  assert.equal(doc.validation.reviewed,false);
 }
});
