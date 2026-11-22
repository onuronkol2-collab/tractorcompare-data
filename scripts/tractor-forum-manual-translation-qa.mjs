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
 for(const match of value.matchAll(/(\d+(?:[.,]\d+)*)\s*(hp|kw|kg|km\/h|rpm|t|%|PS|ch|cv)\b/gi)){
  const quantity=match[1].replaceAll(",",".");
  // Significant unit-sensitive metrics must not change silently.
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
 if(targetBody.length<sourceBody.length*.45||targetBody.length>sourceBody.length*2.7)
  errors.push("suspicious_length");
 if(sourceTitle.trim()===targetTitle.trim())errors.push("untranslated_title");
 const orig=sourceTitle+"\n"+sourceBody,translation=targetTitle+"\n"+targetBody;
 if(!same(numberTokens(orig),numberTokens(translation)))errors.push("numeric_facts_changed");
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
