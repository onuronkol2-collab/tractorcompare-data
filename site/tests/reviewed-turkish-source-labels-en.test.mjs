import test from "node:test";
import assert from "node:assert/strict";
import { REVIEWED_TURKISH_SOURCE_LABELS_EN as TERMS } from "../src/lib/reviewed-turkish-source-labels-en.ts";
import { specLabel } from "../src/lib/catalog.ts";

const sourceSpec=(name)=>({spec_name:name,canonical_key:"unknown_source_specific_label",
 spec_value:"125",unit:"kW",measurement_standard:"ECE R120",
 verified_at:"2026-11-21T19:00:00Z",source_url:"https://example.org/tractor.pdf",
 evidence_text:"Manufacturer source text"});

test("all 120 source-verified Turkish headings display in English without changing original source",()=>{
 assert.equal(Object.keys(TERMS).length,120);
 const seen=new Set();
 for(const [label,english] of Object.entries(TERMS)){
  const key=label.trim().replace(/\s+/g," ").toLocaleLowerCase("tr");
  assert.ok(!seen.has(key),"Duplicate normalized source: "+label);seen.add(key);
  assert.ok(/[ÇĞİÖŞÜçğıöşü]/u.test(label),"Only measured Turkish-language sources may be added");
  assert.ok(english.trim()&&english!==label,"Missing English translation for "+label);
  const record=sourceSpec(label);const before=structuredClone(record);
  assert.equal(specLabel(record,"en"),english,"Not displayed in English: "+label);
  assert.deepEqual(record,before,"No source/OEM measurement mutation: "+label);
 }
});
test("measurement and technical qualifiers remain visible",()=>{
 const en=k=>specLabel(sourceSpec(k),"en");
 assert.notEqual(en("Nominal Motor GüCü (ECE R120, KW)"),en("Azami Motor GüCü (ECE R120, KW)"));
 assert.notEqual(en("Azami Motor GüCü (ECE R120, CV)"),en("Azami Motor GüCü (ECE R120, KW)"));
 assert.match(en("Azami Motor GüCü (ECE R120, CV)"),/ECE R120, CV/);
 assert.match(en("PTO Güç Tahmini (Arazi)"),/Estimated|estimate/i);
 assert.match(en("PTO Güç Tahmini (Sabit)"),/Estimated|estimate/i);
 assert.notEqual(en("2WD Yerden AçıKlıK"),en("4WD Yerden AçıKlıK"));
 assert.match(en("Opsiyonel öN PTO 1000 Motor Devri"),/Optional/i);
 assert.match(en("YaklaşıK Sevk AğıRlığı öN Aks SüSpansiyonlu"),/Approximate/i);
});
test("legacy English title-casing of Turkish i/I does not hide reviewed labels",()=>{
 const raw=sourceSpec("Kabin iç hacmi");
 const before=structuredClone(raw);
 assert.equal(specLabel(raw,"en"),"Cab interior volume");
 assert.deepEqual(raw,before);
 const mixed=sourceSpec("Arka lastik ölçüsü");
 assert.equal(specLabel(mixed,"en"),"Rear tyre size");
});
test("unknown manufacturer-specific source headings are not translated by guessing",()=>{
 const source=sourceSpec("Unknown OEM-specific phrase with unverified meaning");
 assert.equal(specLabel(source,"en"),"Unknown OEM-Specific Phrase With Unverified Meaning");
});
