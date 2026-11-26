import {AREA_SQM} from "./farm-cost.mjs";
function number(value,min,max){if(typeof value!=="number"||!Number.isFinite(value)||value<min||value>max)throw new RangeError("Invalid number");return value;}
export function ownershipCost(x){
 const purchase=number(x.purchase,0,1e12),deposit=number(x.deposit,0,purchase),rate=number(x.rate,0,100)/1200,months=number(x.months,1,600);
 if(!Number.isInteger(months))throw new RangeError("Invalid term");
 const resale=number(x.resale,0,purchase),years=number(x.years,0.1,100),rent=number(x.rent,0,1e9),hours=number(x.hours,0,8760),operating=number(x.operating,0,1e9);
 const principal=purchase-deposit;
 const payment=rate===0?principal/months:principal*rate/(-Math.expm1(-months*Math.log1p(rate)));
 const depreciation=(purchase-resale)/years;
 const breakEven=rent>operating&&depreciation>0?depreciation/(rent-operating):null;
 return {payment,interest:Math.max(0,payment*months-principal),depreciation,ownership:depreciation+operating*hours,rental:rent*hours,breakEven:Number.isFinite(breakEven)?breakEven:null};
}
const power={kW:1,HP:0.7456998715822702,PS:0.73549875};
const area=AREA_SQM;
export const FARM_AREA_UNITS=Object.freeze(Object.keys(area));
export function convertFarmUnit(value,unit){
 number(value,0,1e12);
 const group=Object.hasOwn(power,unit)?power:Object.hasOwn(area,unit)?area:null;
 if(!group)throw new RangeError("Invalid unit");
 return Object.fromEntries(Object.entries(group).map(([key,factor])=>[key,value*group[unit]/factor]));
}
/** Numerical screening only; no certification of physical or safe compatibility. */
export function implementScreenDetails(pairs){
 const unknown=()=>({state:"unknown",margin:null});
 const invalid=()=>({state:"unknown",rows:Array.from({length:3},unknown)});
 if(!Array.isArray(pairs)||pairs.length!==3)return invalid();
 // Validate non-missing values even when their counterpart is missing.
 if(pairs.some(pair=>!Array.isArray(pair)||pair.length!==2||pair.some(v=>v!==null&&(typeof v!=="number"||!Number.isFinite(v)||v<0||v>1e9))))return invalid();
 const rows=pairs.map(([available,required])=>available===null||required===null?unknown():({state:available<required?"insufficient":"matched",margin:available-required}));
 const state=rows.some(row=>row.state==="insufficient")?"insufficient":rows.some(row=>row.state==="unknown")?"unknown":"matched";
 return {state,rows};
}
export function implementScreen(pairs){return implementScreenDetails(pairs).state;}
export function validateMaintenanceNote(value){
 if(!value||typeof value.model!=="string"||!value.model.trim()||value.model.length>80)throw new RangeError("Invalid note");
 return {model:value.model.trim(),meter:number(value.meter,0,1e7),fuel:number(value.fuel,0,1e6),cost:number(value.cost,0,1e12)};
}

export const MAX_MAINTENANCE_RECORDS=200;
/** A versioned, bounded local-only history; legacy single note is preserved. */
export function readMaintenanceHistory(value){
 if(value===null)return [];
 if(value&&value.version===2){
  if(!Array.isArray(value.records)||value.records.length>MAX_MAINTENANCE_RECORDS)throw new RangeError("Invalid history");
  return value.records.map(validateMaintenanceNote);
 }
 return [validateMaintenanceNote(value)];
}
export function appendMaintenanceRecord(records,note){
 if(!Array.isArray(records)||records.length>=MAX_MAINTENANCE_RECORDS)throw new RangeError("History full");
 return {version:2,records:[...records.map(validateMaintenanceNote),validateMaintenanceNote(note)]};
}
export function maintenanceTotals(records){
 if(!Array.isArray(records)||records.length>MAX_MAINTENANCE_RECORDS)throw new RangeError("Invalid history");
 const totals={count:0,fuel:0,cost:0};
 for(const value of records){const row=validateMaintenanceNote(value);totals.count++;totals.fuel+=row.fuel;totals.cost+=row.cost;}
 return totals;
}

/** Parse only a versioned export. Never treat arbitrary files as trusted records. */
export function parseMaintenanceExport(raw){if(typeof raw!=="string"||raw.length>262144)throw new RangeError("Invalid history file");const value=JSON.parse(raw);if(!value||value.version!==2)throw new RangeError("Unsupported export");return {version:2,records:readMaintenanceHistory(value)};}
