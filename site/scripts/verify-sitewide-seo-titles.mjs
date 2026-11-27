import {decodeEvidenceEntities,evidenceText} from "../../supabase/functions/_shared/evidence-text.mjs";
/**
 * Full-build SEO title inventory for every real HTML document in all locales.
 *
 * 60 chars is a crawler's display heuristic, NOT a Google character limit:
 * record overlength titles, never silently truncate model / market / year /
 * equipment identity to make an arbitrary score. Structural errors fail CI.
 */
import {builtHtmlDocuments} from "./built-html-documents.mjs";
import {resolve} from "node:path";
import {fileURLToPath} from "node:url";

import {scanHeadTags} from "./verify-sitewide-meta-descriptions.mjs";
const h1Tag=/<h1\b[^>]*>([\s\S]*?)<\/h1\s*>/i;
const locales=new Set(["tr","zh","hi","pt-br","fr","de","ru","ja","es"]);
// Audit browser-visible text, not HTML source byte length: "&amp;" is one
// displayed character, and encoded punctuation must not inflate Bing reports.
const unescapeText=decodeEvidenceEntities;
const clean=s=>evidenceText(s,{separator:""});

// Bibliographic data is valuable on the page, but is generally poor title
// copy. Warn on English source/provenance leaked into published model headings;
// it is NOT a reason to automatically truncate unknown technical variants.
export const hasBibliographicTitleLeak=title=>
  /\b(?:brochure|manufacturer\s+(?:data|model|configuration|specification)|OEM\s+PDF|official\s+PDF)\b/i.test(title);

export function inspectSeoTitle(html,file="index.html",parsedHead){
  // Search-engine ownership challenge files are not editorial pages. Their
  // verification bytes must remain untouched (even if they contain <html>).
  if(/^yandex_[a-f0-9]+\.html$/i.test(file)
     && /Verification:\s*[a-f0-9]+/i.test(html))return null;
  if(/^naver[a-f0-9]+\.html$/i.test(file)
     && /naver-site-verification:/i.test(html))return null;
  if(!/<html\b/i.test(html))return null;
  const head=html.match(/<head\b[^>]*>([\s\S]*?)<\/head\s*>/i)?.[1];
  // Title is RCDATA: a literal angle-bracket string is text, not an element.
  const matches=head?(parsedHead??scanHeadTags(head)).titles.map(x=>unescapeText(x).replace(/\s+/g," ").trim()):[];
  const title=matches[0]||"";
  const isModel=/(?:^|\/)tractors\/[^/]+\/index\.html$/.test(file);
  const heading=clean(html.match(h1Tag)?.[1]||"");
  const parts=file.split("/");
  const locale=locales.has(parts[0])?parts[0]:"en";
  const errors=[];
  if(matches.length!==1||!title)errors.push("missing-or-duplicate-title");
  // Published model H1 is generated from the exact manufacturer+model name.
  // A title that loses it risks indexing the wrong model or variant family.
  if(isModel&&(!heading||!title.includes(heading)))
    errors.push("model-identity-absent-from-title");
  return {title,length:title.length,heading,isModel,locale,errors};
}

/**
 * Only identical titles of the SAME model route across observed locales.
 * These are editorial review candidates, not automatic indexing failures:
 * unusually long exact model identities may legitimately use the same title.
 * Never compare different models here or infer missing locales from a sample.
 */
export function crossLocaleModelTitleGroups(records){
  const groups=new Map();
  for(const {file,title} of records){
    const match=/^(?:(tr|zh|hi|pt-br|fr|de|ru|ja|es)\/)?tractors\/([^/]+)\/index\.html$/.exec(file);
    if(!match||!title?.trim())continue;
    const locale=match[1]||"en",slug=match[2];
    const normalized=title.normalize("NFC").replace(/\s+/g," ").trim();
    const key=JSON.stringify([slug,normalized]);
    const group=groups.get(key)??{slug,title:normalized,locales:new Map()};
    group.locales.set(locale,file);
    groups.set(key,group);
  }
  return [...groups.values()].filter(group=>group.locales.size>1)
    .map(({slug,title,locales})=>({slug,title,locales:[...locales.keys()].sort(),
      files:[...locales.values()].sort()}))
    .sort((a,b)=>a.slug.localeCompare(b.slug)||a.title.localeCompare(b.title));
}

export function createSeoTitleCollector(root){
  const summary={
    htmlDocuments:0,modelPages:0,over60:0,over105:0,over160:0,
    byLocale:{},errors:[],duplicates:[],longExamples:[],bibliographyExamples:[],bibliographyTitles:0
  };
  const modelTitles=new Map();
  const modelTitleRecords=[];
  return {
    add(file,html,parsedHead){
      const page=inspectSeoTitle(html,file,parsedHead);
      if(!page)return;
      summary.htmlDocuments++;
      if(page.isModel)summary.modelPages++;
      for(const code of page.errors)summary.errors.push({file,code});
      const group=summary.byLocale[page.locale]??={pages:0,over60:0,over105:0,over160:0};
      group.pages++;
      if(page.length>60){
        summary.over60++;
        group.over60++;
        if(summary.longExamples.length<30)
          summary.longExamples.push({file,length:page.length,title:page.title.slice(0,180)});
      }
      if(page.isModel&&hasBibliographicTitleLeak(page.title)){
        summary.bibliographyTitles++;
        if(summary.bibliographyExamples.length<25)
          summary.bibliographyExamples.push({file,title:page.title.slice(0,180)});
      }
      if(page.length>105){summary.over105++;group.over105++;}
      if(page.length>160){summary.over160++;group.over160++;}
      // A localized title must identify exactly one model page. We report
      // duplicates for editorial QA rather than hiding a real variant.
      if(page.isModel && page.title){
        modelTitleRecords.push({file,title:page.title});
        const key=page.locale+"::"+page.title;
        const previous=modelTitles.get(key);
        if(previous&&previous!==file)
          summary.duplicates.push({file,previous,title:page.title.slice(0,160)});
        else modelTitles.set(key,file);
      }
    },
    finish(){
      if(!summary.htmlDocuments)throw Error("No HTML documents found for title QA");
      summary.crossLocaleCandidates=crossLocaleModelTitleGroups(modelTitleRecords);
      return summary;
    }
  };
}

export function auditBuiltSeoTitles(dir){
  const root=resolve(dir);
  const collector=createSeoTitleCollector(root);
  for(const {file,html} of builtHtmlDocuments(root))collector.add(file,html);
  return collector.finish();
}

if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  try{
    const dir=resolve(process.argv[2]||"site/dist");
    const report=auditBuiltSeoTitles(dir);
    const {htmlDocuments,modelPages,over60,over105,over160,byLocale,errors,duplicates,longExamples,bibliographyTitles,bibliographyExamples,crossLocaleCandidates}=report;
    console.log("TRACTORVS_SITEWIDE_TITLE_QA "+JSON.stringify({
      htmlDocuments,modelPages,over60,over105,over160,
      modelTitleDuplicates:duplicates.length,crossLocaleTitleGroups:crossLocaleCandidates.length,sourceNoteTitleCandidates:bibliographyTitles,structuralErrors:errors.length,byLocale
    }));
    if(longExamples.length)console.log("TITLE_QA_SAMPLES "+JSON.stringify(longExamples.slice(0,16)));
    if(bibliographyExamples.length)console.log("TITLE_QA_SOURCE_NOTE_REVIEW "+JSON.stringify(bibliographyExamples.slice(0,16)));
    if(duplicates.length)console.warn("TITLE_QA_DUPLICATE_MODELS "+JSON.stringify(duplicates.slice(0,20)));
    if(crossLocaleCandidates.length)console.warn("TITLE_QA_CROSS_LOCALE_REVIEW "+JSON.stringify(crossLocaleCandidates));
    if(errors.length){
      console.error("TITLE_QA_ERRORS "+JSON.stringify(errors.slice(0,30)));
      process.exitCode=1;
    }
  }catch(e){
    console.error("TITLE_QA_FAILED "+String(e?.message||e));
    process.exitCode=1;
  }
}
