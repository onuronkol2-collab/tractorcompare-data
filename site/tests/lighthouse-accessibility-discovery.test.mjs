import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {LOCALES,localizedPath} from "../src/lib/locales.ts";

const file=(path)=>readFileSync(new URL("../src/"+path,import.meta.url),"utf8");
const glossary=file("components/TractorGlossary.astro");
const cases=file("components/TractorLearningCases.astro");
const forum=file("components/ForumHub.astro");
const composer=file("components/ForumComposer.astro");

const relativeLuminance=(hex)=>{
 const [r,g,b]=hex.replace("#","").match(/.{2}/g).map(x=>parseInt(x,16)/255)
  .map(c=>c<=.04045?c/12.92:((c+.055)/1.055)**2.4);
 return .2126*r+.7152*g+.0722*b;
};
const contrast=(fg,bg)=>{
 const a=relativeLuminance(fg),b=relativeLuminance(bg);
 return (Math.max(a,b)+.05)/(Math.min(a,b)+.05);
};

test("glossary labels and case-study subtitles meet normal-text WCAG AA contrast",()=>{
 for(const fg of ["#32633a"]){
  assert.ok(contrast(fg,"#f4f7f2")>=4.5,fg+" unreadable on light background");
  assert.ok(contrast(fg,"#ffffff")>=4.5,fg+" unreadable on white card");
 }
 assert.ok(contrast("#c8f3a4","#285b40")>=4.5,"dark glossary call to action");
 assert.match(glossary,/\.glossary-kicker,\.glossary-section-kicker\{[^}]*color:#32633a/);
 assert.match(glossary,/\.glossary-kicker\{color:#b9df91;/);
 assert.match(glossary,/\.glossary-next \.glossary-section-kicker\{color:#c8f3a4;/);
 assert.match(glossary,/\.glossary-deepdives-index\{[^}]*color:#32633a/);
 assert.match(cases,/\.case-study-kicker\{[^}]*color:#32633a/);
});

test("real forum topic metadata is readable on white cards",()=>{
 assert.ok(contrast("#315f3d","#ffffff")>=7,"forum topic metadata insufficient for small text");
 assert.match(forum,/\.community-topic-meta\{[^}]*color:#315f3d/);
 assert.match(forum,/class="community-topic-meta"/);
});

test("forum publication action has a real crawlable fallback and never advertises an unverified post URL",()=>{
 assert.match(composer,/import \{[^\n}]*localizedPath[^\n}]*\} from "\.\.\/lib\/locales\.ts"/);
 assert.match(composer,/<a data-forum-publication-link href=\{localizedPath\(lang,"\/forum\/"\)\} hidden rel="noopener noreferrer">/);
 assert.match(composer,/publicationLink\.href=lastPublicHref;publicationLink\.hidden=false/);
 assert.match(composer,/publicationLink\.hidden=true/);
 for(const lang of LOCALES){
  const expected=localizedPath(lang,"/forum/");
  assert.ok(expected.startsWith(lang==="en"?"/":"/"+lang+"/"));
 }
});
