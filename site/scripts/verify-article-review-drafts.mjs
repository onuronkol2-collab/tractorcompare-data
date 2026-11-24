import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {createHash} from "node:crypto";
const read=path=>readFileSync(new URL("../"+path,import.meta.url),"utf8");
const blobSha=s=>createHash("sha1").update("blob "+Buffer.byteLength(s)+"\0").update(s).digest("hex");
const source=read("src/lib/tractor-technical-deep-dives.ts");
const component=read("src/components/TractorTechnicalDeepDive.astro");
const articles=JSON.parse(source.split("export const TECHNICAL_DEEP_DIVES = ")[1].split("] as const;")[0]+"]");
const locales=["de","fr","es","pt-br","zh","hi","ru","ja"];
// Source English uses commas for grouped integers and dots for decimals.
 // Decimal source values must retain a decimal separator and the exact digits;
 // never equate 1.341 kW conversion factors with 1341 or round 102.0 to 102.
const tokens=s=>[...s.matchAll(/(?<![0-9])(?:[0-9]{1,3}(?:[, \u00a0\u202f][0-9]{3})+|[0-9]+(?:\.[0-9]+)?)(?:E)?(?![0-9])/g)].map(x=>x[0]);
const escaped=s=>s.replace(/[.*+?^$(){}|[\]\\]/g,"\\$&");
function numberRetained(src,translated,lang){
 const group=/^\d{1,3}(?:,\d{3})+$/.test(src);
 const decimal=/^\d+\.\d+$/.test(src);
 const commaDecimal=["de","fr","es","pt-br","ru"].includes(lang);
 let pattern=escaped(src);
 if(group){
  const parts=src.split(",");
  pattern="(?:"+parts.join("")+"|"+parts.join(commaDecimal?"[. \\u00a0\\u202f]":"[, \\u00a0\\u202f]")+")";
 }else if(decimal){
  pattern=src.split(".").map(escaped).join(commaDecimal?",":"\\.");
 }
 return new RegExp("(?<![0-9])(?<![0-9][.,])"+pattern+"(?![0-9A-Z]|[.,][0-9])","u").test(translated);
}
assert.ok(numberRetained("1.341","1,341 hp","de"));
assert.ok(!numberRetained("1.341","1341 hp","de"));
assert.ok(!numberRetained("1.341","1.341 hp","de"));
assert.ok(numberRetained("3,000","3 000 kg","fr"));
assert.ok(!numberRetained("3,000","3,000 kg","de"));
assert.ok(!numberRetained("540","540E","en"));
assert.ok(numberRetained("540","540, 540E and 1000","en"));
assert.ok(!numberRetained("72","72.1","en"));
assert.ok(!numberRetained("72.1","172.1","en"));
const scripts={zh:/\p{Script=Han}/u,hi:/\p{Script=Devanagari}/u,ru:/\p{Script=Cyrillic}/u,ja:/[\p{Script=Hiragana}\p{Script=Katakana}]/u};
let count=0, paragraphs=0;
for(const type of ["pto","hydraulic","power"]){
 const seen=new Set();
 for(const region of ["western","eastern"]){
  const doc=JSON.parse(read("docs/translation-review/"+type+"-"+region+"-languages-draft.json"));
  assert.equal(doc.state,"draft-needs-independent-editorial-review");
  assert.equal(doc.reviewed,false);
  assert.equal(doc.notForPublication,true);
  assert.equal(doc.sourceBlobSha,blobSha(source),"Source blob changed: independent review must be repeated");
  assert.equal(doc.sourceComponentBlobSha,blobSha(component),"Rendering/source disclosure changed");
  assert.equal(doc.sourceSlug,type==="pto"?"pto-and-power-take-off":type==="hydraulic"?"tractor-hydraulic-lift-explained":"tractor-engine-power-and-torque");
  const article=articles.find(a=>a.slug===doc.sourceSlug);
  assert.ok(article);
  const expectedSources=["https://tractortestlab.unl.edu/","https://www.oecd.org/en/topics/tractors.html",...(type==="power"?[
   "https://eur-lex.europa.eu/eli/reg/2019/405/oj/eng",
   "https://www.dlg.org/en/magazin/survey-tests/tractor-model-descriptions-no-standardised-information",
   "https://www.nist.gov/pml/special-publication-811/nist-guide-si-appendix-b-conversion-factors/nist-guide-si-appendix-b9",
   "https://admin.basaktraktor.com.tr/upload/4c2bf423-d9a1-4ffc-aa6b-1f0188c313aa-2075%20BK.pdf"
  ]:[type==="pto"?"https://www.hse.gov.uk/agriculture/topics/machinery/safe-use-1.htm":"https://www.hse.gov.uk/agriculture/topics/machinery/fluid.htm"])];
  assert.deepEqual(doc.source.sources,expectedSources);
  for(const url of expectedSources)assert.ok(component.includes(url));
  assert.ok(component.includes(doc.source.verification));
  assert.deepEqual(doc.source.sections,article.sections.map(s=>({anchor:s.anchor,title:s.title.en,paragraphs:s.paragraphs.en})));
  for(const field of ["title","description","lead","comparisonNote"])assert.equal(doc.source[field],article[field].en);
  for(const [lang,entry] of Object.entries(doc.translations)){
   assert.ok(locales.includes(lang)&&!seen.has(lang));
   seen.add(lang);
   function validate(src,value,label){
    assert.ok(typeof value==="string"&&value.trim()&&value!==src,lang+" "+label);
    assert.ok(value.length<=Math.max(src.length*5,180),lang+" unusually long "+label);
    if(scripts[lang])assert.ok(scripts[lang].test(value),lang+" script "+label);
    for(const n of new Set(tokens(src)))assert.ok(numberRetained(n,value,lang),lang+" missing or altered "+n+" in "+label);
    for(const standard of ["ISO 14396","UN/ECE R120","OECD Code 2"])if(src.includes(standard))assert.ok(value.includes(standard),lang+" missing "+standard);
   }
   for(const field of ["title","description","lead","comparisonNote","verification"])validate(doc.source[field],entry[field],field);
   assert.equal(entry.sections.length,article.sections.length);
   entry.sections.forEach((s,i)=>{
    const original=article.sections[i];assert.equal(s.anchor,original.anchor);
    validate(original.title.en,s.title,s.anchor);
    assert.equal(s.paragraphs.length,original.paragraphs.en.length);
    s.paragraphs.forEach((p,j)=>{validate(original.paragraphs.en[j],p,s.anchor+"/"+j);paragraphs++});
   });
   assert.equal(entry.sourceLabels.length,expectedSources.length);
   assert.ok(entry.sourceLabels.every(x=>typeof x==="string"&&x.trim()));
   count++;
  }
 }
 assert.deepEqual([...seen].sort(),[...locales].sort());
}
const ui=JSON.parse(read("docs/translation-review/technical-guide-ui-draft.json"));
assert.equal(ui.state,"draft-needs-independent-editorial-review");
assert.equal(ui.reviewed,false);
assert.equal(ui.notForPublication,true);
assert.equal(ui.sourceComponentBlobSha,blobSha(component));
assert.deepEqual(Object.keys(ui.labels).sort(),[...locales].sort());
const uiKeys=["home","articles","guide","eyebrow","read","compareTractors","photoFullscreen","photoAltPrefix","photoDisclaimer","contents","fairComparison","verifyHeading","apply","nextHeading","nextDescription","compare","catalog","relatedTopics","relatedGuide","sourceLanguageEnglish","sourceLanguageTurkish","glossaryEnglish","glossaryEnglishNotice","reviewDate"];
let uiLabels=0;
for(const [lang,labels] of Object.entries(ui.labels)){
 assert.deepEqual(Object.keys(labels).sort(),[...uiKeys].sort());
 for(const [key,value] of Object.entries(labels)){
  assert.ok(typeof value==="string"&&value.trim().length>1&&value.length<=300,lang+" "+key);
  // Japanese short UI labels can be entirely Kanji (e.g. 記事, 編集確認).
  // Keep the stricter kana requirement for full article paragraphs above.
  const uiScript=lang==="ja"?/[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}]/u:scripts[lang];
  if(uiScript)assert.ok(uiScript.test(value),lang+" script "+key);
  uiLabels++;
 }
}
// Partial glossary drafts must match the exact original rows and guide links.
const glossarySource=read("src/lib/tractor-glossary.ts");
const glossaryRows=JSON.parse(glossarySource.split("export const GLOSSARY_ROWS = ")[1].split("] as const;")[0]+"]");
const expectedIds=[...new Set(articles.flatMap(a=>a.glossary))].sort();
assert.equal(expectedIds.length,14);
const glossaryLocales=new Set();
let glossaryEntries=0,glossaryFields=0;
for(const region of ["western","eastern"]){
 const doc=JSON.parse(read("docs/translation-review/glossary-core-"+region+"-languages-draft.json"));
 assert.equal(doc.state,"draft-needs-independent-editorial-review");
 assert.equal(doc.reviewed,false);
 assert.equal(doc.notForPublication,true);
 assert.equal(doc.sourceBlobSha,blobSha(glossarySource));
 assert.deepEqual(doc.source.map(x=>x.id).sort(),expectedIds);
 for(const entry of doc.source){
  const r=glossaryRows.find(x=>x[1]===entry.id);
  assert.deepEqual(entry,{id:r[1],name:r[3],definition:r[5],example:r[7],caution:r[9]});
 }
 for(const [lang,entries] of Object.entries(doc.translations)){
  assert.ok(locales.includes(lang)&&!glossaryLocales.has(lang));
  glossaryLocales.add(lang);
  assert.deepEqual(Object.keys(entries).sort(),expectedIds);
  for(const original of doc.source){
   const entry=entries[original.id];
   assert.deepEqual(Object.keys(entry).sort(),["caution","definition","example","name"]);
   for(const key of ["name","definition","example","caution"]){
    const value=entry[key];
    // Torque (Nm) is a legitimate identical technical label in Brazilian Portuguese.
    const identicalTechnicalLabel=lang==="pt-br"&&original.id==="torque"&&key==="name"&&value==="Torque (Nm)";
    assert.ok(typeof value==="string"&&value.trim()&&(value!==original[key]||identicalTechnicalLabel),lang+" "+original.id+" "+key);
    const script=lang==="ja"&&key==="name"?/[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}]/u:scripts[lang];
    if(script)assert.ok(script.test(value),lang+" script "+original.id+" "+key);
    for(const n of new Set(tokens(original[key])))assert.ok(numberRetained(n,value,lang),lang+" missing "+n+" "+original.id+" "+key);
    if(original[key].includes("1⅜"))assert.ok(value.includes("1⅜"),lang+" changed shaft diameter");
    if(original[key].includes("ECE/ISO"))assert.ok(value.includes("ECE/ISO"),lang+" changed standard");
    glossaryFields++;
   }
   glossaryEntries++;
  }
 }
}
assert.deepEqual([...glossaryLocales].sort(),[...locales].sort());
console.log(JSON.stringify({draftTranslations:count,bodyParagraphs:paragraphs,uiLabels,glossaryEntries,glossaryFields,structuralChecks:"passed",independentReview:"pending",publicationApproved:false}));
