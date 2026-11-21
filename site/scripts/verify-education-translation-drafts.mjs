import assert from "node:assert/strict";
import {readFileSync,existsSync} from "node:fs";
import {createHash} from "node:crypto";
import {resolve} from "node:path";
import {GLOSSARY_ROWS,GLOSSARY_SECTIONS} from "../src/lib/tractor-glossary.ts";
import {TRACTOR_PART_ROWS,TRACTOR_PART_SECTIONS} from "../src/lib/tractor-parts.ts";
import {TECHNICAL_DEEP_DIVES} from "../src/lib/tractor-technical-deep-dives.ts";
import {TRACTOR_LEARNING_CASES} from "../src/lib/tractor-learning-cases.ts";
import {EDUCATION_UI_SOURCE} from "../src/lib/tractor-education-ui.ts";
import {TRACTOR_EDUCATION_TERMINOLOGY} from "../src/lib/tractor-education-terminology.ts";
const LANGUAGES=["zh","hi","pt-br","fr","de","ru","ja","es"];
const original=Object.fromEntries([
 ["glossary",GLOSSARY_ROWS.map(r=>({id:r[1],fields:{name:r[3],definition:r[5],example:r[7],caution:r[9]}}))],
 ["parts",TRACTOR_PART_ROWS.map(r=>({id:r[1],fields:{name:r[3],location:r[5],purpose:r[7],example:r[9],caution:r[11]}}))],
 ["glossarySections",Object.entries(GLOSSARY_SECTIONS).map(([id,x])=>({id,fields:{name:x.en[0],intro:x.en[1]}}))],
 ["partSections",Object.entries(TRACTOR_PART_SECTIONS).map(([id,x])=>({id,fields:{name:x.en[0],intro:x.en[1]}}))],
 ["articleMeta",TECHNICAL_DEEP_DIVES.map(x=>({id:x.slug,fields:{title:x.title.en,description:x.description.en,lead:x.lead.en}}))],
 ["articleSections",TECHNICAL_DEEP_DIVES.flatMap(x=>x.sections.map(s=>({id:x.slug+"--"+s.anchor,fields:{title:s.title.en,p0:s.paragraphs.en[0],p1:s.paragraphs.en[1]}})))],
 ["cases",TRACTOR_LEARNING_CASES.map(x=>({id:x.id,fields:{title:x.title.en,situation:x.situation.en,explanation:x.explanation.en,remember:x.remember.en}}))],
 ["ui",EDUCATION_UI_SOURCE.map(x=>({id:x.id,fields:x.en}))]
]);
const hash=createHash("sha256").update(JSON.stringify({
 glossary:GLOSSARY_ROWS,glossarySections:GLOSSARY_SECTIONS,parts:TRACTOR_PART_ROWS,
 partSections:TRACTOR_PART_SECTIONS,articles:TECHNICAL_DEEP_DIVES,cases:TRACTOR_LEARNING_CASES,ui:EDUCATION_UI_SOURCE,terminology:TRACTOR_EDUCATION_TERMINOLOGY
})).digest("hex");
function digits(s){return [...s.matchAll(/(?<![A-Za-z])\d+(?:[.,]\d+)?(?:E)?/g)].map(x=>x[0])}
/** Preserve the exact technical magnitude, allowing ONLY thousands grouping
 * (3,000 / 3.000 / 3 000 / 3000) for source English integer thousands.
 * Ordinary decimals, rpm, power standards and all other numeric literals
 * remain exact; this is NOT numeric rounding or measurement conversion.
 */
export function technicalNumberRetained(sourceToken,translated){
 if(typeof sourceToken!=="string" || typeof translated!=="string")return false;
 if(/^[0-9]{1,3}(?:,[0-9]{3})+$/.test(sourceToken)){
  const parts=sourceToken.split(",");
  const grouped=parts.join("[,.\\s\\u00a0\\u202f]");
  const plain=parts.join("");
  return new RegExp("(?<![0-9.,])(?:"+grouped+"|"+plain+")(?![0-9.,])","u").test(translated);
 }
 return translated.includes(sourceToken);
}
function scriptOk(lang,s){
 if(lang==="zh")return /[\u4e00-\u9fff]/.test(s);
 if(lang==="hi")return /[\u0900-\u097f]/.test(s);
 if(lang==="ru")return /[\u0400-\u052f]/.test(s);
 if(lang==="ja")return /[\u3040-\u30ff\u4e00-\u9fff]/.test(s);
 return true;
}
export function checkTranslationBundle(locale,doc,{requireApproved=false}={}){
 assert.equal(doc?.locale,locale);
 assert.equal(doc?.sourceHash,hash,"Source changed; all translations must be audited again");
 assert.equal(doc?.validation?.complete,true,"Translation is incomplete");
 if(requireApproved)assert.equal(doc.validation.reviewed,true,"Must not publish unchecked machine translation");
 let total=0,identical=0,script=0,numerical=0;
 for(const [category,rows] of Object.entries(original)){
  const translated=doc.data?.[category];
  assert.ok(translated&&typeof translated==="object",category+" missing");
  assert.deepEqual(Object.keys(translated).sort(),rows.map(x=>x.id).sort(),
   category+" count, anchor or ordering mismatch");
  for(const {id,fields} of rows){
   const entries=translated[id];
   assert.ok(entries&&typeof entries==="object",category+"/"+id+" missing");
   assert.deepEqual(Object.keys(entries).sort(),Object.keys(fields).sort(),
    "Missing translated field "+category+"/"+id);
   for(const [key,source] of Object.entries(fields)){
    const value=entries[key];
    assert.ok(typeof value==="string"&&value.trim().length>=Math.min(3,source.length),
      "Blank translation "+category+"/"+id+"/"+key);
    assert.ok(value.length<=Math.max(70,source.length*4),
      "Unnaturally long translation "+category+"/"+id+"/"+key);
    if(source.length>70&&value.toLowerCase().trim()===source.toLowerCase().trim())identical++;
    for(const n of digits(source)){
     assert.ok(technicalNumberRetained(n,value),"Technical number modified in "+locale+" "+category+"/"+id+"/"+key+": "+n);
     numerical++;
    }
    if(scriptOk(locale,value))script++;
    total++;
   }
  }
 }
 assert.equal(identical,0,"English long paragraphs left untranslated");
 if(["zh","hi","ru","ja"].includes(locale))
  assert.ok(script/total>.70,"Target script barely appears, probable English fallback");
 assert.ok(total>690&&numerical>15,"Data coverage suspiciously low");
 return {locale,fields:total,modelHash:hash,numericalChecks:numerical,scriptShare:script/total,approved:doc.validation.reviewed};
}
export function loadBundle(locale){
 const file=resolve("site/src/lib/education-draft-translations/"+locale+".json");
 assert.ok(existsSync(file),"Missing draft translation "+locale);
 return JSON.parse(readFileSync(file,"utf8"));
}
if(process.argv[1]?.endsWith("verify-education-translation-drafts.mjs")){
 const one=process.env.EDU_TARGET_LOCALE;
 const langs=one?[one]:LANGUAGES;
 for(const locale of langs){
  assert.ok(LANGUAGES.includes(locale),"Invalid target locale "+locale);
  const report=checkTranslationBundle(locale,loadBundle(locale),{
   requireApproved:process.env.EDU_REQUIRE_EDITOR_APPROVAL==="true"
  });
  console.log("EDUCATION_TRANSLATION_QA "+JSON.stringify(report));
 }
}
