import {test} from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {TRACTOR_LEARNING_CASES} from "../src/lib/tractor-learning-cases.ts";
import {GLOSSARY_TERMS} from "../src/lib/tractor-glossary.ts";
const glossary=readFileSync(new URL("../src/components/TractorGlossary.astro",import.meta.url),"utf8");
const cases=readFileSync(new URL("../src/components/TractorLearningCases.astro",import.meta.url),"utf8");

test("five original learning cases explain practical mechanisms rather than claim field diagnosis",()=>{
 assert.equal(TRACTOR_LEARNING_CASES.length,5);
 const terms=new Set(GLOSSARY_TERMS.map(x=>x.id));
 const ids=new Set();
 for(const c of TRACTOR_LEARNING_CASES){
  assert.match(c.id,/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
  assert.ok(!ids.has(c.id));ids.add(c.id);
  assert.ok(terms.has(c.termId),"Case has broken explanation link "+c.id);
  for(const lang of ["tr","en"]){
   assert.ok(c.title[lang].length>=35);
   assert.ok(c.situation[lang].length>=85);
   assert.ok(c.explanation[lang].length>=140);
   assert.ok(c.remember[lang].length>=90);
  }
 }
 assert.match(cases,/TRACTOR_LEARNING_CASES\.map/);
 assert.match(cases,/entry\.termId/);
 assert.match(glossary,/<TractorLearningCases lang=\{lang\}\/>/);
});
