/** Compare only already reviewed numeric measurements. A metadata match is not
 * source verification. Caller must use published records with separately reviewed
 * model/variant/market identity and a real report locator. No inferred conversion.
 */
const dimensions=new Map([["pto_power_kw","kW"],["drawbar_power_kw","kW"],["fuel_l_per_hour","L/h"],["specific_fuel_g_per_kwh","g/kWh"],["hydraulic_flow_l_per_min","L/min"]]);
const contextKeys=["protocol","protocolVersion","loadPoint","configuration","measurementBasis","unit"];
function isText(x){return typeof x==="string"&&x.trim()===x&&x.length>0&&x.length<=200;}
function valid(row){
 return row&&row.evidence==="independent_reviewed"&&dimensions.has(row.metric)&&dimensions.get(row.metric)===row.unit&&
  typeof row.value==="number"&&Number.isFinite(row.value)&&row.value>0&&row.value<=1e9&&
  isText(row.modelId)&&isText(row.reportId)&&isText(row.reportLocator)&&
  contextKeys.every(k=>isText(row[k]));
}
export function compareIndependentMeasurements(left,right){
 if(!valid(left)||!valid(right))return {state:"insufficient_evidence",difference:null,percent:null};
 if(left.modelId===right.modelId)return {state:"same_model",difference:null,percent:null};
 if(left.metric!==right.metric||contextKeys.some(k=>left[k]!==right[k]))return {state:"different_conditions",difference:null,percent:null};
 const difference=right.value-left.value,percent=difference/left.value*100;
 return Number.isFinite(percent)?{state:"matched_metadata",difference,percent}:{state:"insufficient_evidence",difference:null,percent:null};
}
