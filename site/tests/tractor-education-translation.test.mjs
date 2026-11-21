import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {TRACTOR_EDUCATION_TERMINOLOGY} from "../src/lib/tractor-education-terminology.ts";
import {EDUCATION_UI_SOURCE} from "../src/lib/tractor-education-ui.ts";

test("all eight native agriculture lexicons preserve twenty identical technical concepts",()=>{
 const locales=["zh","hi","pt-br","fr","de","ru","ja","es"];
 assert.deepEqual(Object.keys(TRACTOR_EDUCATION_TERMINOLOGY).sort(),locales.sort());
 const ids=Object.keys(TRACTOR_EDUCATION_TERMINOLOGY.es).sort();
 assert.equal(ids.length,20);
 for(const lang of locales){
  const terms=TRACTOR_EDUCATION_TERMINOLOGY[lang];
  assert.deepEqual(Object.keys(terms).sort(),ids);
  for(const [en,val] of Object.entries(terms)){
   assert.ok(typeof val==="string"&&val.trim().length>=(lang==="zh"?2:3),
    "Meaningful Chinese two-character terms such as 扭矩 and 轴距 are valid: "+lang+" "+en);
   if(en==="540E")assert.ok(val.includes("540E"));
   if(en.startsWith("610 mm"))assert.ok(/610\s*mm|610\s*мм|610\s*ミリ|610\s*毫米/.test(val),
    "No 610 mm reference in "+lang);
  }
 }
});
test("separate localized encyclopedia UI text includes no silent English placeholder",()=>{
 assert.equal(EDUCATION_UI_SOURCE.length,7);
 const ids=new Set();
 for(const item of EDUCATION_UI_SOURCE){
  assert.ok(!ids.has(item.id));ids.add(item.id);
  assert.deepEqual(Object.keys(item.en).sort(),Object.keys(item.tr).sort());
  assert.ok(Object.values(item.en).every(s=>typeof s==="string"&&s.trim()));
  assert.ok(Object.values(item.tr).every(s=>typeof s==="string"&&s.trim()));
 }
});
test("machine translation is not allowed to publish without complete review",()=>{
 const translator=readFileSync(new URL("../scripts/translate-tractor-education.mjs",import.meta.url),"utf8");
 const verifier=readFileSync(new URL("../scripts/verify-education-translation-drafts.mjs",import.meta.url),"utf8");
 const enPage=readFileSync(new URL("../src/components/TractorEducationLocalized.astro",import.meta.url),"utf8");
 const articles=readFileSync(new URL("../src/components/TractorEducationArticleLocalized.astro",import.meta.url),"utf8");
 assert.match(translator,/state:"draft-needs-editorial-review"/);
 assert.match(translator,/reviewed:false/);
 assert.match(translator,/step=kind==="ui"\?1:maxBatch/);
 // Timed-out jobs must retain completed batches without accepting corrupt drafts.
 assert.match(translator,/await rename\(tmp,archiveFile\)/);
 assert.match(translator,/output\.data\[kind\]=result;\s*await saveDraft\(\)/);
 assert.match(translator,/DROPPED_INVALID_RESUME_ROWS/);
 assert.match(verifier,/requireApproved/);
 assert.match(verifier,/Source changed; all translations must be audited again/);
 for(const c of [enPage,articles]){
  assert.match(c,/validation\?\.complete!==true/);
  assert.match(c,/validation\?\.reviewed!==true/);
  assert.match(c,/throw new Error\("UNPUBLISHED/);
 }
});

test("translation provider calls require explicit workflow dispatch and approval",()=>{
 const smoke=readFileSync(new URL("../../.github/workflows/tractor-education-translation-smoke.yml",import.meta.url),"utf8");
 const bulk=readFileSync(new URL("../../.github/workflows/tractorvs-education-translate.yml",import.meta.url),"utf8");
 for(const workflow of [smoke,bulk]){
  assert.match(workflow,/workflow_dispatch:/);
  assert.match(workflow,/authorize_translation:/);
  assert.match(workflow,/default: false/);
  assert.match(workflow,/inputs\.authorize_translation == true/);
  assert.match(workflow,/github\.event_name == 'workflow_dispatch'/);
  assert.match(workflow,/github\.repository == 'onuronkol2-collab\/tractorcompare-data'/);
  assert.match(workflow,/github\.ref == 'refs\/heads\/feat\/tractor-encyclopedia-10-language-editorial-20261120'/);
 }
 assert.match(smoke,/offline_contract:/);
 assert.match(smoke,/provider_smoke:/);
 assert.match(smoke,/needs: offline_contract/);
 // These commands must appear only in jobs gated by deliberate authorization.
 assert.match(smoke,/provider_smoke:[\s\S]*?if: >-[\s\S]*?inputs\.authorize_translation == true[\s\S]*?run: node site\/scripts\/test-editorial-translation\.mjs/);
 assert.match(bulk,/locale_drafts:[\s\S]*?inputs\.authorize_translation == true[\s\S]*?translate-tractor-education\.mjs/);
});
