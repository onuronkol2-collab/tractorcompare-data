import {farmCost,farmAreaInHectares} from "./farm-cost.mjs";
export function compareFieldScenarios(shared,a,b){
 const common={area:farmAreaInHectares(shared.area,shared.unit),price:shared.price,annualHours:0,fixed:0};
 const calculate=s=>farmCost({...s,...common});
 const left=calculate(a),right=calculate(b);
 const metrics=["time","litres","operatingField"];
 return {left,right,difference:Object.fromEntries(metrics.map(key=>[key,right[key]-left[key]]))};
}
export function serviceInterval(last,current,interval){
 if(![last,current,interval].every(v=>typeof v==="number"&&Number.isFinite(v)&&v>=0&&v<=1e7)||current<last||interval<=0)throw new RangeError("Invalid service interval");
 const next=last+interval;return {next,remaining:Math.max(0,next-current),overdue:Math.max(0,current-next)};
}
export function readShortlist(value){
 if(!Array.isArray(value)||value.length>20)throw new RangeError("Invalid shortlist");
 if(value.some(v=>typeof v!=="string"||!/^[a-z0-9-]{1,160}$/.test(v)))throw new RangeError("Invalid model");
 return [...new Set(value)];
}
export function addShortlist(value,slug){return readShortlist([...new Set([...readShortlist(value),slug])]);}
