/**
 * Published, market-matched Deutz-Fahr 5D GS editorial comparison pilot.
 * Every figure comes from two separately reviewed public tractor rows and
 * the same identifiable DEUTZ-FAHR Türkiye 5D GS Stage V specification PDF.
 * No guessed model year, economy, field tests or price assertions.
 */
import type {PublicSpec,TractorRecord} from "./catalog.ts";

export const DEUTZ_5D_GS_PILOT={
  leftId:"8cfb4aa9-2087-5a63-bb02-0a6c8149ddd5",
  rightId:"e443a07b-6d85-4787-9233-27a838b0d029",
  source:"https://www.deutz-fahr.com/media/5D_Keyline_Faz_5_TRK.pdf",
  variant:"5D Series GS / Stage V (Türkiye 2025 manufacturer brochure)",
  path:"/compare/deutz-fahr-5090-d-gs-vs-5100-d-gs/",
} as const;

const fields=[
 {key:"engine_rated_power",unit:"HP",tr:"Nominal motor gücü (ECE R120)",en:"Rated engine power (ECE R120)"},
 {key:"engine_max_power",unit:"HP",tr:"Azami motor gücü (ECE R120)",en:"Maximum engine power (ECE R120)"},
 {key:"engine_torque",unit:"Nm",tr:"Azami motor torku",en:"Maximum engine torque"},
 {key:"engine_displacement",unit:"L",tr:"Motor hacmi",en:"Engine displacement"},
 {key:"transmission_gear_configuration",unit:null,tr:"Vites düzeni",en:"Gearbox configuration"},
 {key:"pto_speeds",unit:"rpm",tr:"Kuyruk mili hız seçenekleri",en:"PTO speed options"},
 {key:"hydraulic_main_flow",unit:"L/min",tr:"Hidrolik pompa debisi",en:"Hydraulic pump flow"},
 {key:"rear_lift_capacity",unit:"kg",tr:"Üretici beyanlı arka kaldırma kapasitesi",en:"Manufacturer-stated rear lift capacity"},
 {key:"wheelbase",unit:"mm",tr:"Dingil mesafesi",en:"Wheelbase"},
 {key:"fuel_tank_capacity",unit:"L",tr:"Yakıt deposu",en:"Diesel fuel tank"},
 {key:"adblue_tank_capacity",unit:"L",tr:"AdBlue deposu",en:"AdBlue tank"},
 {key:"operating_weight_cab",unit:"kg",tr:"Kabinli ağırlık (ek balastsız)",en:"Cab weight (without added ballast)"},
] as const;

type Field=typeof fields[number];
type ValidSpec=PublicSpec & {verified_at:string;evidence_text:string;source_url:string};
export interface CuratedPairRow {
  key:Field["key"];
  labelTr:string;
  labelEn:string;
  left:string;
  right:string;
  unit:string|null;
  same:boolean;
  context:string|null;
}
export interface CuratedPair {
 left:TractorRecord;
 right:TractorRecord;
 rows:CuratedPairRow[];
 ratedDelta:number;
 torqueDelta:number;
 source:string;
}
function sameVariantModel(model:TractorRecord|undefined,id:string,name:string):model is TractorRecord{
 return Boolean(model&&model.tractor_id===id&&model.brand_name==="Deutz-Fahr"&&
  model.model_name===name&&model.market==="Türkiye"&&
  model.variant===DEUTZ_5D_GS_PILOT.variant&&model.model_year===null);
}
function specFor(model:TractorRecord,field:Field):ValidSpec|null{
 const candidates=model.specifications.filter(spec=>spec.canonical_key===field.key);
 if(candidates.length!==1)return null; // conflicting or absent claims are never guessed
 const spec=candidates[0];
 if(spec.unit!==field.unit||spec.source_url!==DEUTZ_5D_GS_PILOT.source||
  spec.source_type!=="manufacturer_specification"||!spec.verified_at?.trim()||
  !spec.evidence_text?.trim()||!/^[-\w][\w\s.,/+–-]{0,65}$/.test(spec.spec_value))return null;
 return spec as ValidSpec;
}
function strictNumber(s:string):number|null{
 if(!/^\d+(?:\.\d{1,3})?$/.test(s))return null;
 const n=Number(s);return Number.isFinite(n)?n:null;
}
export function curatedDeutz5DPair(tractors:readonly TractorRecord[]):CuratedPair|null{
 const left=tractors.find(m=>m.tractor_id===DEUTZ_5D_GS_PILOT.leftId);
 const right=tractors.find(m=>m.tractor_id===DEUTZ_5D_GS_PILOT.rightId);
 if(!sameVariantModel(left,DEUTZ_5D_GS_PILOT.leftId,"5090 D")||
    !sameVariantModel(right,DEUTZ_5D_GS_PILOT.rightId,"5100 D"))return null;
 const rows:CuratedPairRow[]=[];
 for(const field of fields){
  const a=specFor(left,field),b=specFor(right,field);
  if(!a||!b||a.measurement_standard!==b.measurement_standard)return null;
  rows.push({key:field.key,labelTr:field.tr,labelEn:field.en,left:a.spec_value,
   right:b.spec_value,unit:field.unit,same:a.spec_value===b.spec_value,
   context:a.measurement_standard});
 }
 const value=(key:CuratedPairRow["key"],side:"left"|"right")=>
  strictNumber(rows.find(row=>row.key===key)?.[side]||"");
 const lp=value("engine_rated_power","left"),rp=value("engine_rated_power","right");
 const lt=value("engine_torque","left"),rt=value("engine_torque","right");
 if(lp===null||rp===null||lt===null||rt===null||lp>=rp||lt>=rt)return null;
 return {left,right,rows,ratedDelta:rp-lp,torqueDelta:rt-lt,source:DEUTZ_5D_GS_PILOT.source};
}
