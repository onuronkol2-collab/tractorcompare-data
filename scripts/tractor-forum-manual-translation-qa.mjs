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
  const lowered=source.toLocaleLowerCase("tr-TR");
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
 if(!numericFactsEqual(orig,translation,locale))errors.push("numeric_facts_changed");
 if(!same(urlTokens(orig),urlTokens(translation)))errors.push("urls_changed");
 if(!same(unitFacts(orig),unitFacts(translation)))errors.push("numeric_units_changed");
 if(!same(headingTokens(sourceBody),headingTokens(targetBody)))errors.push("heading_structure_changed");
 if(!same(tableShape(sourceBody),tableShape(targetBody)))errors.push("table_shape_changed");
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
