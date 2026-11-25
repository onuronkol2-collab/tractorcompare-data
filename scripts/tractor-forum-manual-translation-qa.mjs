/**
 * Offline QA helper for ChatGPT-assisted TractorVS forum translations.
 * Never contacts a provider or database. A PASS here is not publication approval.
 */
export const LOCALES=Object.freeze(["en","zh","hi","pt-br","fr","de","ru","ja","es"]);
const BRANDS=Object.freeze([
 "Same","Deutz-Fahr","CLAAS","John Deere","Case IH","Fendt","Kubota",
 "New Holland","Massey Ferguson","Swaraj","Yanmar","TYM","CLIMMAR",
 "FADA","NAEDA","SDF","TractorVS"
]);
const NOTES=[
 ["reliability","Bayilerin üreticilerden duyduğu memnuniyet","Bayi memnuniyeti"],
 ["uncertainty","kapsam","araştırma"]
];
function numberTokens(value) {
 return [...value.matchAll(/(?<![A-Za-z])\d+(?:[.,]\d+)*/g)]
  .map(m=>m[0].replaceAll(",",".")).sort();
}
const MONTHS=[
 ["ocak",1],["şubat",2],["mart",3],["nisan",4],["mayıs",5],
 ["haziran",6],["temmuz",7],["ağustos",8],["eylül",9],["ekim",10],
 ["kasım",11],["aralık",12]
];
/** Japanese/Chinese month notation adds numeric month tokens not present in Turkish. */
function numericFactsEqual(source,translated,locale){
 const expected=numberTokens(source),actual=numberTokens(translated);
 if(locale==="zh"||locale==="ja"){
  // In this explicit sowing/harvest context, lowercase ekim is not October.
  const lowered=source.replace(/(?<![\p{L}\p{N}_])üretim giderini ekim döneminde karşılıyor ancak hasat döneminde(?![\p{L}\p{N}_])/gu,"üretim giderini tohum ekme döneminde karşılıyor ancak hasat döneminde").toLocaleLowerCase("tr-TR");
  for(const [name,num] of MONTHS){
   const inSource=[...lowered.matchAll(new RegExp("(?<!\\p{L})"+name+"(?!\\p{L})","gu"))].length;
   const inTarget=[...translated.matchAll(new RegExp("(?<![0-9])"+num+"(?=\\s*月)","g"))].length;
   for(let n=0;n<Math.min(inSource,inTarget);n++){
    const idx=actual.indexOf(String(num));
    if(idx!==-1)actual.splice(idx,1);
   }
  }
 }
 return JSON.stringify(expected)===JSON.stringify(actual.sort());
}
const FR_MONTHS=["janvier","février","mars","avril","mai","juin",
 "juillet","août","septembre","octobre","novembre","décembre"];
const TR_MONTH_RE="(ocak|şubat|mart|nisan|mayıs|haziran|temmuz|ağustos|eylül|ekim|kasım|aralık)";
const FR_MONTH_RE="(janvier|février|mars|avril|mai|juin|juillet|août|septembre|octobre|novembre|décembre)";
function pad2(s){return String(s).padStart(2,"0");}
function calendarFactsEqual(source,target,locale){
 if(!["fr","zh","ja"].includes(locale))return true;
 const srcDays=[...source.matchAll(new RegExp(
  "(\\d{1,2})\\s+"+TR_MONTH_RE+"\\s+(\\d{4})","giu"))]
  .map(m=>m[3]+"-"+pad2(MONTHS.findIndex(([name])=>name===m[2].toLocaleLowerCase("tr-TR"))+1)+"-"+pad2(m[1])).sort();
 const srcRanges=[...source.matchAll(new RegExp(
  TR_MONTH_RE+"\\s*[–-]\\s*"+TR_MONTH_RE+"\\s+(\\d{4})","giu"))]
  .map(m=>m[3]+"-"+pad2(MONTHS.findIndex(([name])=>name===m[1].toLocaleLowerCase("tr-TR"))+1)+
   "-"+pad2(MONTHS.findIndex(([name])=>name===m[2].toLocaleLowerCase("tr-TR"))+1)).sort();
 let targetDays=[],targetRanges=[];
 if(locale==="fr"){
  targetDays=[...target.matchAll(new RegExp(
   "(\\d{1,2})(?:er)?\\s+"+FR_MONTH_RE+"\\s+(\\d{4})","giu"))]
   .map(m=>m[3]+"-"+pad2(FR_MONTHS.indexOf(m[2].toLowerCase())+1)+"-"+pad2(m[1])).sort();
  targetRanges=[...target.matchAll(new RegExp(
   FR_MONTH_RE+"\\s+et\\s+"+FR_MONTH_RE+"\\s+(\\d{4})","giu"))]
   .map(m=>m[3]+"-"+pad2(FR_MONTHS.indexOf(m[1].toLowerCase())+1)+
    "-"+pad2(FR_MONTHS.indexOf(m[2].toLowerCase())+1)).sort();
 }else{
  targetDays=[...target.matchAll(/(\d{4})年(\d{1,2})月(\d{1,2})日/g)]
   .map(m=>m[1]+"-"+pad2(m[2])+"-"+pad2(m[3])).sort();
  targetRanges=[...target.matchAll(/(\d{4})年(\d{1,2})月(?:至|から)(\d{1,2})月/g)]
   .map(m=>m[1]+"-"+pad2(m[2])+"-"+pad2(m[3])).sort();
 }
 return same(srcDays,targetDays)&&same(srcRanges,targetRanges);
}
/**
 * For French/Russian editorial display, 2 045, 2 045 and 2 045 all denote
 * the same grouped integer as the Turkish source 2.045. Only target display
 * text is normalized for numeric checks, never the source or URLs.
 */
function normalizeGroupedThousands(value,locale){
 if(locale!=="fr"&&locale!=="ru")return value;
 return value.replace(/(\d{1,3})[ \u00a0\u202f](\d{3})(?!\d)/gu,"$1.$2");
}
function urlTokens(value) {
 return [...value.matchAll(/https:\/\/[^\s<>"'\])}]+/g)]
  .map(m=>m[0].replace(/[.,;!?]+$/,"")).sort();
}
function headingTokens(value){
 return [...value.matchAll(/^(#{1,6})\s+.+$/gm)].map(m=>m[1].length);
}
function tableShape(value){
 return (value.match(/^\s*\|.*\|\s*$/gm)||[]).map(
  x=>(x.match(/\|/g)||[]).length
 );
}
/**
 * Bind EACH score to its actual tractor brand and rank (rather than merely
 * comparing a sorted bag of numbers). Never allow a score swap to pass.
 * Checks all markdown result tables with 3 cells and a leading numeric rank.
 */
function normalizedScorePairs(value){
 const rows=[];
 for(const line of value.split("\n")){
  const l=line.trim();
  if(!l.startsWith("|")||!l.endsWith("|"))continue;
  const cells=l.split("|").slice(1,-1).map(v=>v.trim().replace(/\*\*/g,""));
  if(cells.length!==3)continue;
  const rank=cells[0].match(/(?:^|\s)(\d{1,2})\s*$/u);
  const score=cells[2].match(/^(\d{1,3})[.,](\d{1,3})$/u);
  if(!rank||!score)continue;
  const brand=cells[1].replace(/\s+/g," ").trim();
  if(!/^[\p{L}\p{N}\p{M}\s'&.()-]+$/u.test(brand)||brand.length>75)continue;
  rows.push(rank[1]+":"+brand+":"+score[1]+"."+score[2]);
 }
 return rows.sort();
}
function bulletCount(value){
 return (value.match(/^\s*[-*+]\s+\S/gm)||[]).length;
}
function scriptPresent(locale,value){
 if(locale==="ru")return /[А-Яа-яЁё]/u.test(value);
 if(locale==="zh")return /[\u4e00-\u9fff]/u.test(value);
 if(locale==="ja")return /[\u3040-\u30ff]/u.test(value);
 if(locale==="hi")return /[\u0900-\u097f]/u.test(value);
 return true;
}
function unitFacts(value){
 const out=[];
 // The source can spell the same percentage "%2,6" (Turkish) while a
 // target language correctly spells it "2.6%" (English/Hindi), or "2,6 %".
 // Normalise the POSITION of the percent sign, never the number itself.
 for(const match of value.matchAll(/(?:%\s*(\d+(?:[.,]\d+)*)|(\d+(?:[.,]\d+)*)\s*%)/g)){
  out.push((match[1]||match[2]).replaceAll(",",".")+" %");
 }
 for(const match of value.matchAll(/(\d+(?:[.,]\d+)*)\s*(hp|kw|kg|km\/h|rpm|t|PS|ch|cv)\b/gi)){
  const quantity=match[1].replaceAll(",",".");
  // Distinguish mechanical units; e.g., 75 hp -> 75 PS is not identical.
  out.push(quantity+" "+match[2].toLowerCase());
 }
 return out.sort();
}
const same=(x,y)=>JSON.stringify(x)===JSON.stringify(y);
export function auditManualForumTranslation({
 sourceTitle,sourceBody,targetTitle,targetBody,locale
}){
 const errors=[];
 if(!LOCALES.includes(locale))errors.push("unsupported_locale");
 for(const [key,value] of Object.entries({sourceTitle,sourceBody,targetTitle,targetBody})){
  if(typeof value!=="string"||!value.trim())errors.push("missing_"+key);
 }
 if(errors.length)return {pass:false,errors};
 if(targetTitle.length<12||targetTitle.length>240)errors.push("invalid_title_length");
 const minLengthRatio=(locale==="zh"||locale==="ja") ? 0.24 : 0.45;
 if(targetBody.length<sourceBody.length*minLengthRatio||targetBody.length>sourceBody.length*2.7)
  errors.push("suspicious_length");
 if(sourceTitle.trim()===targetTitle.trim())errors.push("untranslated_title");
 const orig=sourceTitle+"\n"+sourceBody,translation=targetTitle+"\n"+targetBody;
 if(!numericFactsEqual(orig,normalizeGroupedThousands(translation,locale),locale))errors.push("numeric_facts_changed");
 if(!calendarFactsEqual(orig,translation,locale))errors.push("calendar_facts_changed");
 if(!same(urlTokens(orig),urlTokens(translation)))errors.push("urls_changed");
 if(!same(unitFacts(orig),unitFacts(normalizeGroupedThousands(translation,locale))))errors.push("numeric_units_changed");
 if(!same(headingTokens(sourceBody),headingTokens(targetBody)))errors.push("heading_structure_changed");
 if(!same(tableShape(sourceBody),tableShape(targetBody)))errors.push("table_shape_changed");
 if(!same(normalizedScorePairs(sourceBody),normalizedScorePairs(targetBody)))errors.push("brand_rank_score_mapping_changed");
 if(bulletCount(sourceBody)!==bulletCount(targetBody))errors.push("list_structure_changed");
 for(const name of BRANDS){
  if(orig.includes(name)&&!translation.includes(name))errors.push("brand_missing:"+name);
 }
 if(!scriptPresent(locale,targetTitle+"\n"+targetBody))errors.push("target_script_missing");
 if(/<script|javascript:/i.test(targetBody))errors.push("unsafe_markup");
 return {
  pass:errors.length===0,errors,locale,
  note:"Structural checks only. A native-language editorial or independent model review is mandatory before seo_approved=true."
 };
}
