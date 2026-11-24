import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {createHash} from "node:crypto";
const read=path=>readFileSync(new URL("../"+path,import.meta.url),"utf8");
const blobSha=s=>createHash("sha1").update("blob "+Buffer.byteLength(s)+"\0").update(s).digest("hex");
const source=read("src/lib/tractor-technical-deep-dives.ts");
const component=read("src/components/TractorTechnicalDeepDive.astro");
const articles=JSON.parse(source.split("export const TECHNICAL_DEEP_DIVES = ")[1].split("] as const;")[0]+"]");
const locales=["de","fr","es","pt-br","zh","hi","ru","ja"];
const digits=s=>[...s.matchAll(/(?<![0-9])(?:[0-9]{1,3}(?:[., \u00a0\u202f][0-9]{3})+|[0-9]+)(?:E)?(?![0-9])/g)].map(x=>x[0].replace(/[., \u00a0\u202f]/g,""));
const scripts={zh:/\p{Script=Han}/u,hi:/\p{Script=Devanagari}/u,ru:/\p{Script=Cyrillic}/u,ja:/[\p{Script=Hiragana}\p{Script=Katakana}]/u};
let count=0, paragraphs=0;
for(const type of ["pto","hydraulic"]){
 const seen=new Set();
 for(const region of ["western","eastern"]){
  const doc=JSON.parse(read("docs/translation-review/"+type+"-"+region+"-languages-draft.json"));
  assert.equal(doc.state,"draft-needs-independent-editorial-review");
  assert.equal(doc.reviewed,false);
  assert.equal(doc.notForPublication,true);
  assert.equal(doc.sourceBlobSha,blobSha(source),"Source blob changed: independent review must be repeated");
  assert.equal(doc.sourceComponentBlobSha,blobSha(component),"Rendering/source disclosure changed");
  assert.equal(doc.sourceSlug,type==="pto"?"pto-and-power-take-off":"tractor-hydraulic-lift-explained");
  const article=articles.find(a=>a.slug===doc.sourceSlug);
  assert.ok(article);
  const expectedSources=["https://tractortestlab.unl.edu/","https://www.oecd.org/en/topics/tractors.html",type==="pto"?"https://www.hse.gov.uk/agriculture/topics/machinery/safe-use-1.htm":"https://www.hse.gov.uk/agriculture/topics/machinery/fluid.htm"];
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
    for(const n of new Set(digits(src)))assert.ok(digits(value).includes(n),lang+" missing "+n+" in "+label);
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
console.log(JSON.stringify({draftTranslations:count,bodyParagraphs:paragraphs,structuralChecks:"passed",independentReview:"pending",publicationApproved:false}));
