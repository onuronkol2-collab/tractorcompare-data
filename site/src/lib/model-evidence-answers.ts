/**
 * Compact, answer-first facts for search and AI retrieval.
 *
 * Critical constraint: the answers are derived ONLY from the published model's
 * evidence-reviewed, source-linked specification rows. Neither product summary
 * fields nor a guessed value can generate a numerical claim here. Conflicting
 * variants/measurement conditions fail closed.
 */
import type {PublicSpec,TractorRecord} from "./catalog.ts";
import {officialManufacturerSourceUrl,reviewedIndependentSourceUrl} from "./catalog.ts";

export type AnswerLanguage="en"|"tr";
export interface EvidenceAnswer {
  id:string;
  question:string;
  answer:string;
  sourceUrl:string;
  sourceType:"manufacturer"|"independent";
  guidePath:string|null;
}
type Candidate={
  value:number;
  unit:string;
  sourceUrl:string;
  sourceType:"manufacturer"|"independent";
  standard:string|null;
  key:string;
};
type Field={
 id:string;
 keys:readonly string[];
 unit:string;
 min:number;
 max:number;
};
const fields:readonly Field[]=[
 {id:"rated-power",keys:["engine_power","engine_rated_power","rated_engine_power"],unit:"hp",min:5,max:999},
 {id:"pto-power",keys:["pto_power_hp","rear_pto_power_hp"],unit:"hp",min:5,max:999},
 // Litre / kilogram are not interchangeable with cm³, daN or PTO power.
 // Optional hitch equipment and measurement points are not normalized away.
 {id:"engine-displacement",keys:["engine_displacement","engine_displacement_l"],unit:"l",min:0.5,max:35},
 {id:"rear-hitch-lift",keys:["rear_lift_capacity","rear_lift_capacity_kg","rear_hitch_lift_capacity_kg"],unit:"kg",min:100,max:30000},
 {id:"wheelbase",keys:["wheelbase","wheelbase_mm"],unit:"mm",min:800,max:7000},
 {id:"fuel",keys:["fuel_tank_capacity","fuel_tank_capacity_l"],unit:"l",min:5,max:3000},
];

function evidenceSource(spec:PublicSpec,brand:string){
 const official=officialManufacturerSourceUrl(spec,brand);
 if(official)return {sourceUrl:official,sourceType:"manufacturer" as const};
 const independent=reviewedIndependentSourceUrl(spec);
 return independent?{sourceUrl:independent,sourceType:"independent" as const}:null;
}
function parseValue(spec:PublicSpec,field:Field):number|null {
 const unit=(spec.unit||"").trim().toLowerCase().replace("litres","l").replace("liters","l");
 if(field.unit==="l"&&unit!=="l"&&unit!=="liter"&&unit!=="litre")return null;
 if(field.unit!== "l"&&unit!==field.unit)return null;
 const raw=spec.spec_value.trim();
 if(!/^\d{1,4}(?:[.,]\d{1,2})?$/.test(raw))return null;
 const value=Number(raw.replace(",","."));
 return Number.isFinite(value)&&value>=field.min&&value<=field.max?value:null;
}
function selectUnambiguous(rows:PublicSpec[],field:Field,brand:string):Candidate|null{
 const candidates:Candidate[]=[];
 for(const spec of rows){
  const key=(spec.canonical_key||"").trim().toLowerCase();
  if(!field.keys.includes(key))continue;
  if(!spec.verified_at?.trim()||!spec.evidence_text?.trim())continue;
  const source=evidenceSource(spec,brand);
  const value=parseValue(spec,field);
  if(!source||value===null)continue;
  const standard=spec.measurement_standard?.trim()||null;
  candidates.push({value,unit:field.unit,...source,standard,key});
 }
 if(!candidates.length)return null;
 // Rated, gross and maximum power measurements can differ. Do not average or
 // silently pick the highest figure. Different recorded standards fail closed.
 const uniqueValues=new Set(candidates.map(c=>c.value));
 const standards=new Set(candidates.map(c=>c.standard?.toLowerCase()||""));
 const keys=new Set(candidates.map(c=>c.key));
 if(uniqueValues.size!==1||standards.size!==1||(field.id==="rated-power"&&keys.size>1))return null;
 return candidates.sort((a,b)=>
  Number(b.sourceType==="manufacturer")-Number(a.sourceType==="manufacturer") ||
  a.sourceUrl.localeCompare(b.sourceUrl))[0];
}
/**
 * May the model's prominent horsepower summary be described as source-backed?
 * Use the same evidence, model identity, value and measurement conflict gate
 * already used for short factual answers. A matching database headline alone
 * never verifies engine/PTO/maximum power equivalence.
 */
export function matchedHeadlinePowerSource(
 tractor:Pick<TractorRecord,"brand_name"|"horsepower"|"specifications">
):{value:number;sourceUrl:string;sourceType:"manufacturer"|"independent"}|null{
 const headline=tractor.horsepower;
 if(typeof headline!=="number"||!Number.isFinite(headline))return null;
 const candidate=selectUnambiguous(tractor.specifications,fields[0],tractor.brand_name);
 if(!candidate||candidate.value!==headline)return null;
 return {value:candidate.value,sourceUrl:candidate.sourceUrl,sourceType:candidate.sourceType};
}

const text={
 en:{
  rated:(name:string,v:string,s:string)=>({
   question:`What verified engine power is reported for ${name}?`,
   answer:`A reviewed source reports ${v} hp of engine power${s}. This is an engine measurement, not a PTO or drawbar power test. Check the exact model and test conditions in the linked document.`,
  }),
  pto:(name:string,v:string,s:string)=>({
   question:`What published PTO power is documented for ${name}?`,
   answer:`A reviewed source reports ${v} hp at the PTO${s}. PTO output should not be confused with rated engine power. Verify the speed and test method before comparing another model.`,
  }),
  "engine-displacement":(name:string,v:string,s:string)=>({
   question:`What is the documented engine displacement of ${name}?`,
   answer:`The reviewed technical source lists an engine displacement of ${v} litres${s}. Displacement is engine volume, not horsepower or fuel consumption. Check the exact variant in the linked source.`,
  }),
  "rear-hitch-lift":(name:string,v:string,s:string)=>({
   question:`What rear hitch lift capacity is documented for ${name}?`,
   answer:`A reviewed source lists ${v} kg for the rear hitch lift capacity${s}. Capacity depends on the measurement point and fitted equipment; confirm the conditions before comparing tractors.`,
  }),
  wheelbase:(name:string,v:string,s:string)=>({
   question:`What is the documented wheelbase of ${name}?`,
   answer:`The reviewed specification gives a wheelbase of ${v} mm${s}. Wheelbase is the distance between front and rear axle centres, not the tractor's overall length.`,
  }),
  fuel:(name:string,v:string,s:string)=>({
   question:`How large is the documented fuel tank of ${name}?`,
   answer:`The reviewed document lists a fuel tank capacity of ${v} litres${s}. Tank size does not tell you the tractor's fuel consumption per hour.`,
  })
 },
 tr:{
  rated:(name:string,v:string,s:string)=>({
   question:`${name} modelinin kaynaklı motor gücü kaç beygir?`,
   answer:`İncelenen kaynakta motor gücü ${v} HP olarak belirtiliyor${s}. Bu değer kuyruk mili veya tekerleklerde ölçülen güç değildir. Doğru model ve test koşullarını kaynak belgesinden kontrol edin.`,
  }),
  pto:(name:string,v:string,s:string)=>({
   question:`${name} modelinin belgelenmiş kuyruk mili gücü kaç HP?`,
   answer:`İncelenen kaynak kuyruk mili gücünü ${v} HP olarak veriyor${s}. Bu sayı motor beygiriyle aynı şey değildir. Başka traktörle karşılaştırırken PTO devrini ve ölçüm yöntemini kontrol edin.`,
  }),
  "engine-displacement":(name:string,v:string,s:string)=>({
   question:`${name} modelinin belgelenmiş motor hacmi kaç litre?`,
   answer:`İncelenen teknik kaynakta motor hacmi ${v} litre olarak belirtiliyor${s}. Motor hacmi, beygir gücü veya yakıt tüketimi değildir. Varyantı bağlantılı belgeden kontrol edin.`,
  }),
  "rear-hitch-lift":(name:string,v:string,s:string)=>({
   question:`${name} modelinin belgelenmiş arka kaldırma kapasitesi kaç kilogram?`,
   answer:`İncelenen kaynak arka askı kaldırma kapasitesini ${v} kg olarak veriyor${s}. Değer ölçüm noktasına ve takılı donanıma bağlı olabilir; modelleri karşılaştırmadan önce koşulları kontrol edin.`,
  }),
  wheelbase:(name:string,v:string,s:string)=>({
   question:`${name} modelinin dingil mesafesi kaç milimetre?`,
   answer:`Kaynağa bağlı teknik değere göre dingil mesafesi ${v} mm${s}. Bu, ön ve arka aksların merkezleri arasındaki mesafedir; traktörün toplam uzunluğu değildir.`,
  }),
  fuel:(name:string,v:string,s:string)=>({
   question:`${name} modelinin mazot deposu kaç litre?`,
   answer:`İncelenen teknik belgede yakıt deposu ${v} litre olarak belirtiliyor${s}. Depo hacmi, traktörün saatte kaç litre yakıt tükettiğini göstermez.`,
  })
 }
} as const;
function formatNumber(value:number,lang:AnswerLanguage){
 return new Intl.NumberFormat(lang==="tr"?"tr-TR":"en-US",{maximumFractionDigits:2}).format(value);
}
function safeStandard(s:string|null):string {
 // Include concise, printable test context only. Never turn large database notes
 // or arbitrary HTML into a confident interpretation.
 if(!s||s.length>90||/[<>\r\n]/.test(s))return "";
 return s;
}
export function modelEvidenceAnswers(tractor:Pick<TractorRecord,"brand_name"|"model_name"|"specifications">,lang:AnswerLanguage):EvidenceAnswer[]{
 const name=tractor.brand_name+" "+tractor.model_name;
 const answers:EvidenceAnswer[]=[];
 for(const field of fields){
  const found=selectUnambiguous(tractor.specifications,field,tractor.brand_name);
  if(!found)continue;
  const standard=safeStandard(found.standard);
  const standardSuffix=standard?(lang==="tr"?" (ölçüm bilgisi: "+standard+")":" (reported context: "+standard+")"):"";
  const v=formatNumber(found.value,lang);
  const phrasing=(text[lang] as Record<string,(n:string,v:string,s:string)=>{question:string;answer:string}>)[field.id==="rated-power"?"rated":field.id==="pto-power"?"pto":field.id];
  const copy=phrasing(name,v,standardSuffix);
  answers.push({
   id:field.id,question:copy.question,answer:copy.answer,
   sourceUrl:found.sourceUrl,sourceType:found.sourceType,
   guidePath:field.id==="rated-power"?"/guides/tractor-engine-power-and-torque/":
     field.id==="pto-power"?"/guides/pto-and-power-take-off/":
     null
  });
  if(answers.length===4)break;
 }
 return answers;
}
