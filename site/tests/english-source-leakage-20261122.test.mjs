import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {specLabel} from "../src/lib/catalog.ts";
import {REVIEWED_TURKISH_SOURCE_LABELS_EN as TERMS} from "../src/lib/reviewed-turkish-source-labels-en.ts";

const fixture=JSON.parse(readFileSync(new URL("./fixtures/english-source-leakage-20261122.json",import.meta.url),"utf8"));
const normalize=x=>x.trim().replace(/\s+/g," ").toLocaleLowerCase("tr").replaceAll("ı","i");
const fakeSpec=source=>({
 spec_name:source,canonical_key:"unreviewed_source_heading",
 spec_value:"125",unit:"kW",verified_at:"2026-11-22",
 source_url:"https://manufacturer.example/verified.pdf",
 measurement_standard:"ECE R120",evidence_text:"OEM identity and evidence unchanged"
});

test("2026-11-22 English-page leakage audit covers exact 110 observed labels and 183 usages",()=>{
 assert.equal(fixture.priorDistinct,110);
 assert.equal(fixture.priorOccurrences,183);
 assert.equal(fixture.labels.length,110);
 assert.equal(fixture.labels.reduce((sum,item)=>sum+item.occurrences,0),183);
 assert.ok(fixture.labels.every(item=>item.source.trim().length>0&&item.exampleSlugs.length>0));
});

test("every observed legacy source label renders as reviewed English without mutating evidence",()=>{
 const normalSet=new Set(Object.keys(TERMS).map(normalize));
 assert.equal(normalSet.size,Object.keys(TERMS).length,"No normalized duplicate mappings");
 for(const {source,exampleSlugs} of fixture.labels){
   const spec=fakeSpec(source);
   const original=structuredClone(spec);
   const displayed=specLabel(spec,"en");
   assert.ok(normalSet.has(normalize(source)),"Missing audited legacy heading: "+source);
   assert.notEqual(displayed,source,"Uncorrected English-page source leakage: "+source);
   assert.doesNotMatch(displayed,/[ÇĞİÖŞÜçğıöşü]/u,"Turkish text in English label: "+source);
   assert.ok(displayed.length>3,"Incomplete translation: "+source);
   assert.deepEqual(spec,original,"Original measurement or citation mutated: "+exampleSlugs[0]);
 }
});

test("manufacturer technical qualifiers and apparently similar data remain distinct",()=>{
 const en=x=>specLabel(fakeSpec(x),"en");
 assert.notEqual(en("BrüT Motor GüCü"),en("Net Motor GüCü"));
 assert.notEqual(en("BrüT Motor GüCü"),en("PTO GüCü"));
 assert.notEqual(en("Arka KaldıRma (24 In Geride)"),en("Arka KaldıRma (Alt Kol UçLarıNda)"));
 assert.notEqual(en("Arka Iz GenişLiğI Minimum"),en("Arka Iz GenişLiğI Maksimum"));
 assert.notEqual(en("2WD öN Lastik"),en("4WD öN Lastik SeçEnekleri"));
 assert.match(en("BrüT Motor GüCü (Metrik PS)"),/\bPS\b/);
 assert.match(en("ÖN EndüStriyel LastiğI (R4)"),/\(R4\)/);
 assert.match(en("Güç Aralığı (üRetici SıNıFlandıRması)"),/manufacturer classification/i);
 assert.equal(en("ROPS öN Iz GenişLiğI"),en("ROPS ÖN Iz GenişLiğI"));
});

test("unknown OEM headings are never machine guessed or recased into false measurements",()=>{
 const source="Unknown OEM model-specific hydraulic measurement";
 const record=fakeSpec(source);
 assert.equal(specLabel(record,"en"),"Unknown OEM Model-Specific Hydraulic Measurement");
 assert.equal(record.spec_name,source);
});
