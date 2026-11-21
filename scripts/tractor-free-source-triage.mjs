/**
 * Offline, free-first TractorVS source triage: NO fetch, Supabase writes, AI,
 * automatic approval or publication. Requires a trusted upstream collector.
 * CLI reads private JSON on stdin, and prints aggregate counts ONLY.
 */
import {fileURLToPath} from "node:url";
import {resolve} from "node:path";

const fold=s=>String(s??"").normalize("NFKC").trim().replace(/\s+/g," ");
const esc=s=>s.replace(/[.*+?^$()|[\]\\]/g,"\\$&");
const host=s=>String(s??"").trim().toLowerCase().replace(/\.$/,"");
export function sourceUrl(raw,trustedHosts=[]){
 let u;
 try{u=new URL(raw)}catch{return null}
 if(u.protocol!=="https:"||u.username||u.password||u.port||u.hostname.includes("%"))return null;
 const h=host(u.hostname);
 if(!h||h==="localhost"||h.endsWith(".localhost")||/^\d{1,3}(?:\.\d{1,3}){3}$/.test(h)||h.includes(":"))return null;
 const allowed=Array.isArray(trustedHosts)?trustedHosts.map(host).filter(h=>h.includes(".")):[];
 if(!allowed.some(root=>h===root||h.endsWith("."+root)))return null;
 u.hash="";
 return u.toString();
}
export function containsPhrase(text,phrase){
 const target=fold(phrase);
 if(!target||target.length>120)return false;
 const p=target.split(" ").map(esc).join("\s+");
 return new RegExp("(?:^|[^\\p{L}\\p{N}])"+p+"(?=$|[^\\p{L}\\p{N}])","iu").test(fold(text));
}
export function evaluateSource(item){
 if(!item||typeof item!=="object")return {state:"invalid",reason:"missing_input",warnings:[]};
 const {target={},document={},evidence={},trustedHosts=[]}=item;
 const warnings=[];
 if(!target.brand||!target.model||!evidence.key||!evidence.value)
  return {state:"invalid",reason:"missing_identity_or_fact",warnings};
 const requested=sourceUrl(document.url,trustedHosts);
 const resolved=sourceUrl(document.finalUrl||document.url,trustedHosts);
 if(!requested||!resolved)return {state:"blocked",reason:"untrusted_source_origin",warnings};
 if(document.httpStatus!==200)return {state:"needs_source",reason:"source_not_http_200",warnings};
 const contentType=String(document.contentType??"").toLowerCase().split(";")[0].trim();
 if(!["text/html","text/plain","application/pdf"].includes(contentType))
  return {state:"needs_source",reason:"unsupported_content_type",warnings};
 if(contentType==="application/pdf"&&document.textExtracted!==true)
  return {state:"needs_source",reason:"pdf_text_not_extracted",warnings};
 const block=String(evidence.modelTechnicalBlock??"");
 if(!block.trim()||block.length>1600)
  return {state:"needs_source",reason:"missing_bounded_technical_block",warnings};
 // Technical facts must FOLLOW the exact model identifier in the same short
 // source excerpt. A navigation link to another model cannot prove a value
 // that appeared earlier in a different product tab.
 const modelText=fold(target.model);
 const modelPattern=new RegExp("(?:^|[^\\p{L}\\p{N}])"+
  modelText.split(" ").map(esc).join("\\s+")+
  "(?=$|[^\\p{L}\\p{N}])","iu");
 const modelMatch=modelPattern.exec(fold(block));
 if(!modelMatch)
  return {state:"needs_identity",reason:"model_absent_from_evidence_block",warnings};
 const localFacts=fold(block).slice(modelMatch.index+modelMatch[0].length,modelMatch.index+modelMatch[0].length+700);
 if(!containsPhrase(localFacts,evidence.label||evidence.key)||
    !containsPhrase(localFacts,evidence.value)||
    (evidence.unit&&!containsPhrase(localFacts,evidence.unit)))
  return {state:"needs_evidence",reason:"value_label_or_unit_missing_after_model",warnings};
 const variant=fold(target.variant);
 if(variant&&!/^(catalog listing|source review|unspecified|unknown|standard review)/i.test(variant)){
  if(!containsPhrase(block,variant))
   return {state:"needs_identity",reason:"variant_not_explicit",warnings};
 }else if(variant)warnings.push("editorial_variant_not_proven");
 const market=fold(target.market);
 if(market&&market.toLowerCase()!=="global"){
  if(!containsPhrase(block,market))
   return {state:"needs_identity",reason:"market_not_explicit",warnings};
 }else warnings.push("market_not_proven");
 if(target.modelYear!==null&&target.modelYear!==undefined){
  const year=Number(target.modelYear);
  if(!Number.isInteger(year)||year<1900||year>2100||!containsPhrase(block,String(year)))
   return {state:"needs_identity",reason:"year_not_explicit",warnings};
 }else warnings.push("model_year_not_proven");
 const key=fold(evidence.key).toLowerCase();
 if(key.includes("power")&&/(rated|max|maximum)/.test(key)){
  if(!evidence.measurementStandard||!containsPhrase(block,evidence.measurementStandard))
   return {state:"needs_standard",reason:"power_standard_not_explicit",warnings};
 }
 if(requested!==resolved)warnings.push("review_redirect_path");
 if(document.title&&!containsPhrase(document.title,target.model))
  warnings.push("shared_or_differently_named_catalogue_page");
 return {state:"review_candidate",reason:"bounded_source_fact_for_editorial_review",warnings};
}
export function groupFetches(candidates){
 const groups=new Map();
 for(const item of candidates){
  const url=sourceUrl(item?.document?.url,item?.trustedHosts);
  if(!url)continue;
  if(!groups.has(url))groups.set(url,[]);
  groups.get(url).push(item);
 }
 return groups;
}
// Compare only independently source-reviewed candidates in the same
// brand/model/variant/market/year/spec/unit/standard scope. Different
// manufacturer's pages are NOT merged into a single market identity.
// A discrepancy is flagged for review, never resolved by majority vote.
export function conflictIndexes(candidates,results){
 const scopes=new Map();
 candidates.forEach((item,index)=>{
  if(results[index].state!=="review_candidate")return;
  const {target={},evidence={}}=item;
  const identity=[
    target.brand,target.model,target.variant,target.market,target.modelYear,
    evidence.key,evidence.unit,evidence.measurementStandard,
  ].map(fold).map(x=>x.toLowerCase());
  const scope=JSON.stringify(identity);
  const value=fold(evidence.value).replace(/^(\d+),(\d+)$/,"$1.$2").toLowerCase();
  if(!scopes.has(scope))scopes.set(scope,new Map());
  const byValue=scopes.get(scope);
  if(!byValue.has(value))byValue.set(value,[]);
  byValue.get(value).push(index);
 });
 const conflicts=new Set();
 for(const byValue of scopes.values()){
  if(byValue.size<2)continue;
  for(const list of byValue.values())for(const i of list)conflicts.add(i);
 }
 return conflicts;
}
export function aggregateTriage(candidates){
 if(!Array.isArray(candidates)||candidates.length>1000)throw Error("Bounded candidate array required.");
 const outcomes={};
 let warnings=0;
 const results=candidates.map(evaluateSource);
 const conflicting=conflictIndexes(candidates,results);
 results.forEach((result,index)=>{
  const state=conflicting.has(index)?"conflict_review":result.state;
  outcomes[state]=(outcomes[state]||0)+1;
  warnings+=result.warnings.length;
 });
 return {records:candidates.length,unique_trusted_documents:groupFetches(candidates).size,
  outcomes,review_warnings:warnings,cross_source_conflicts:conflicting.size,
  published:0,db_changes:0,paid_ai_calls:0};
}
async function main(){
 let input="";
 for await(const chunk of process.stdin){
  input+=chunk.toString();
  if(Buffer.byteLength(input)>1_000_000)throw Error("Private input exceeded safe limit.");
 }
 process.stdout.write(JSON.stringify(aggregateTriage(JSON.parse(input)))+"\n");
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 main().catch(()=>{console.error("Private source triage failed (details suppressed).");process.exitCode=1;});
}
