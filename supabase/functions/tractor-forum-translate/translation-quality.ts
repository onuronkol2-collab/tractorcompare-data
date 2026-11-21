// Pure, no-network quality checks for consent-gated forum translations.
// Normalize only calendar-month notation; do not relax score/model/URL checks.
const MONTHS: ReadonlyArray<readonly [string, number]> = [
 ["ocak",1], ["şubat",2], ["mart",3], ["nisan",4],
 ["mayıs",5], ["haziran",6], ["temmuz",7], ["ağustos",8],
 ["eylül",9], ["ekim",10], ["kasım",11], ["aralık",12]
];

export const TRANSLATION_RESUME_FIELDS =
 "topic_id,locale,title,body,state,qa_notes,source_hash,model,reviewed_by_model";

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

export function isUntranslatedTurkishTitle(sourceTitle:string,translatedTitle:string):boolean {
 return sourceTitle.trim()===translatedTitle.trim() &&
  /[çğıöşüÇĞİÖŞÜ]/u.test(sourceTitle);
}
