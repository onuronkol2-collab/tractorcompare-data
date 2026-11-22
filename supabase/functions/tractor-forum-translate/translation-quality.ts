// Pure, no-network quality checks for consent-gated forum translations.
// Normalize only calendar-month notation; do not relax score/model/URL checks.
const MONTHS: ReadonlyArray<readonly [string, number]> = [
 ["ocak",1], ["şubat",2], ["mart",3], ["nisan",4],
 ["mayıs",5], ["haziran",6], ["temmuz",7], ["ağustos",8],
 ["eylül",9], ["ekim",10], ["kasım",11], ["aralık",12]
];

export const TRANSLATION_RESUME_FIELDS =
 "topic_id,locale,title,body,state,qa_notes,source_hash,provider,model,reviewed_by_model,seo_approved";

function numberTokens(text:string): string[] {
 return [...text.matchAll(/(?<![A-Za-z])\d+(?:[.,]\d+)*/g)]
  .map(m=>m[0].replaceAll(",", "."));
}

export function sameNumericFacts(source:string, translated:string, locale:string):boolean {
 const expected=numberTokens(source);
 const actual=numberTokens(translated);
 // Chinese and Japanese dates routinely render Turkish month names as "11月",
 // which adds a numeric month but does not change an article's factual numbers.
 // Permit only the exact source-month occurrences explicitly marked as months.
 if(locale==="zh"||locale==="ja"){
  const lowered=source.toLocaleLowerCase("tr-TR");
  for(const [name,number] of MONTHS){
   const originalMonths=[...lowered.matchAll(new RegExp(
    "(?<!\\p{L})"+name+"(?!\\p{L})","gu"))].length;
   const digitMonths=[...translated.matchAll(new RegExp(
    "(?<![0-9])"+number+"(?=\\s*月)","g"))].length;
   const allowed=Math.min(originalMonths,digitMonths);
   for(let i=0;i<allowed;i++){
    const at=actual.indexOf(String(number));
    if(at>=0)actual.splice(at,1);
   }
  }
 }
 return expected.sort().join("|")===actual.sort().join("|");
}

/**
 * Strict, offline safeguards for the ONE fixed synthetic tractor sentence.
 * Numerical equality alone accepted hp -> PS/ch/cv and semantic hallucinations.
 * This is not general machine translation certification, nor a publication gate.
 * Unambiguous orthographic forms (e.g. Hindi एचपी and kilogram spellings) are
 * allowed; metric horsepower is NOT silently equated to mechanical hp.
 */
export function samePhysicalUnitFacts(source:string, translated:string):boolean {
 // CJK text attaches digits and sentence particles without whitespace.
 // Reject adjacent ASCII word fragments without rejecting 75hpの or 为75hp.
 const unitPattern=/(?<![0-9A-Za-z])(\d+(?:[.,]\d+)*)\s*(hp|kg|kw|ps|ch|cv|马力|公斤|एचपी|किलोग्राम|キログラム|кг)(?![A-Za-z])/giu;
 const normalizeUnit=(unit:string):string=>{
  const u=unit.toLowerCase();
  if(["公斤","किलोग्राम","キログラム","кг"].includes(u))return "kg";
  if(u==="एचपी")return "hp";
  return u;
 };
 const facts=(input:string)=>[...input.normalize("NFKC").matchAll(unitPattern)]
  .map(m=>m[1].replaceAll(",",".")+" "+normalizeUnit(m[2])).sort();
 return JSON.stringify(facts(source))===JSON.stringify(facts(translated))&&facts(source).length>0;
}

/**
 * Conservative, language-specific glossary for the fixed source mentioning
 * BOTH a tractor and hydraulic lifting. False negatives remain possible;
 * a true result never substitutes for an independent human language review.
 */
export function syntheticTractorTerminologyPresent(locale:string, text:string):boolean {
 const terms:Record<string,readonly [RegExp,RegExp]>={
  en:[/\btractor\b/i,/\bhydraulic/i],
  zh:[/拖拉机/u,/液压/u],
  hi:[/ट्रैक्टर/u,/हाइड्रोलिक/u],
  "pt-br":[/\btrator\b/i,/hidráulic/iu],
  fr:[/tracteur/iu,/hydrauliqu/iu],
  de:[/traktor/iu,/hydraul/iu],
  ru:[/трактор/iu,/гидравл/iu],
  ja:[/トラクター/u,/油圧/u],
  es:[/tractor/iu,/hidráulic/iu]
 };
 const required=terms[locale];
 return !!required&&required.every(re=>re.test(text));
}

export function isUntranslatedTurkishTitle(sourceTitle:string,translatedTitle:string):boolean {
 return sourceTitle.trim()===translatedTitle.trim() &&
  /[çğıöşüÇĞİÖŞÜ]/u.test(sourceTitle);
}

/**
 * A historically imported translation may have state=ready but no SEO approval.
 * Never equate the worker receipt with public publication eligibility.
 * The reviewer receipt is compulsory even when older records say "ready".
 */
export function verifiedReadyTranslation(
 existing:{
  source_hash?:string; state?:string; seo_approved?:boolean|null;
  reviewed_by_model?:string|null
 }|null|undefined,
 sourceHash:string
):boolean {
 return !!existing && !!sourceHash && existing.source_hash===sourceHash &&
  existing.state==="ready" && existing.seo_approved===true &&
  typeof existing.reviewed_by_model==="string" && existing.reviewed_by_model.trim().length>0;
}
