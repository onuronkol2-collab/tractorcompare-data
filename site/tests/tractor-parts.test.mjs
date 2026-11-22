import assert from "node:assert/strict";
import test from "node:test";
import {readFileSync} from "node:fs";
import {TRACTOR_PARTS,TRACTOR_PART_SECTIONS,GLOSSARY_TO_PART} from "../src/lib/tractor-parts.ts";
import {GLOSSARY_TERMS} from "../src/lib/tractor-glossary.ts";
import {TECHNICAL_DEEP_DIVES} from "../src/lib/tractor-technical-deep-dives.ts";
const component=readFileSync(new URL("../src/components/TractorParts.astro",import.meta.url),"utf8");
const glossary=readFileSync(new URL("../src/components/TractorGlossary.astro",import.meta.url),"utf8");

test("tractor parts have distinct direct links and practical accessible original text in two languages",()=>{
 assert.equal(TRACTOR_PARTS.length,57);
 assert.equal(Object.keys(TRACTOR_PART_SECTIONS).length,5);
 const ids=new Set(GLOSSARY_TERMS.map(t=>t.id));
 for(const p of TRACTOR_PARTS){
  assert.match(p.id,/^part-[a-z0-9]+(?:-[a-z0-9]+)*$/);
  assert.ok(!ids.has(p.id),"Duplicate direct anchor: "+p.id);ids.add(p.id);
  assert.ok(p.group in TRACTOR_PART_SECTIONS);
  for(const lang of ["tr","en"]){
   assert.ok(p.name[lang].trim().length>=3);
   assert.ok(p.location[lang].trim().length>=12);
   assert.ok(p.purpose[lang].trim().length>=33,"Part needs a simple purpose: "+p.id+" "+lang);
   assert.ok(p.example[lang].trim().length>=20);
   assert.ok(p.caution[lang].trim().length>=16);
  }
 }
});
test("direct links connect only real parts to appropriate technical terms",()=>{
 const partIds=new Set(TRACTOR_PARTS.map(p=>p.id));
 const technicalIds=new Set(GLOSSARY_TERMS.map(t=>t.id));
 assert.ok(Object.keys(GLOSSARY_TO_PART).length>=40);
 for(const [termId,partId] of Object.entries(GLOSSARY_TO_PART)){
  assert.ok(technicalIds.has(termId),"Glossary term not found: "+termId);
  assert.ok(partIds.has(partId),"Linked part does not exist: "+partId);
 }
 assert.match(glossary,/GLOSSARY_TO_PART\[term\.id/);
});
test("new parts are actually readable and searchable on the indexable glossary page",()=>{
 assert.match(glossary,/import TractorParts from "\.\/TractorParts\.astro"/);
 assert.match(glossary,/<TractorParts lang=\{lang\}\/>/);
 assert.match(glossary,/<a href="#traktor-parcalari">/);
 assert.match(glossary,/TRACTOR_PARTS\.length/);
 assert.match(component,/data-glossary-term/);
 assert.match(component,/data-glossary-group/);
 assert.match(component,/data-search=/);
 assert.match(component,/id=\{part.id\}/);
 assert.match(component,/part\.purpose\[lang\]/);
 assert.match(component,/part\.location\[lang\]/);
 assert.match(component,/part\.example\[lang\]/);
 assert.match(component,/part\.caution\[lang\]/);
 assert.match(component,/parts-flow-grid/);
 assert.match(component,/https:\/\/extension\.psu\.edu\/power-take-off-pto-safety/);
 assert.match(component,/https:\/\/www\.ars\.usda\.gov\//);
 assert.doesNotMatch(component,/fake part photo|unlicensed|AggregateRating|FAQPage/i);
});
test("technical terms and three deep-dive Turkish chapters are rewritten in everyday language",()=>{
 assert.equal(GLOSSARY_TERMS.length,96);
 const byId=Object.fromEntries(GLOSSARY_TERMS.map(t=>[t.id,t]));
 for(const id of ["torque","hydraulic-pressure","pto","manual-gearbox","rear-lift","crankshaft","model-identity"])
   assert.ok(byId[id].definition.tr.length>65,"Simple explanation is missing for "+id);
 assert.match(byId["torque"].definition.tr,/kavanoz/);
 assert.match(byId["hydraulic-flow"].definition.tr,/bir dakikada/);
 assert.match(byId["pto"].definition.tr,/arkasında/);
 assert.equal(TECHNICAL_DEEP_DIVES.length,3);
 for(const guide of TECHNICAL_DEEP_DIVES){
  assert.ok(guide.lead.tr.length>200);
  assert.equal(guide.sections.length,guide.slug==="tractor-engine-power-and-torque"?6:5);
  for(const section of guide.sections){
    assert.equal(section.paragraphs.tr.length,["olcum-standartlari","hp-ps-kw"].includes(section.anchor)?3:2);
    assert.ok(section.paragraphs.tr.every(p=>p.length>85));
  }
 }
});
