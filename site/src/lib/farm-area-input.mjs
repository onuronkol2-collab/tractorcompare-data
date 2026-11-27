import {AREA_SQM,farmAreaInHectares} from "./farm-cost.mjs";

// Keep the HTML range aligned with the existing calculation engine.
// The unit switch changes the interpretation of the typed value, not the value.
// Rounding only moves a boundary inward if floating point conversion rejects it.
export function farmAreaInputBounds(unit){
 if(typeof unit!=="string"||!Object.hasOwn(AREA_SQM,unit))throw new RangeError("Invalid area unit");
 const factor=AREA_SQM[unit];
 let min=0.0001*10000/factor,max=1000000*10000/factor;
 try{farmAreaInHectares(min,unit)}catch{min*=1+1e-12}
 try{farmAreaInHectares(max,unit)}catch{max*=1-1e-12}
 return {min,max};
}

/** @param {HTMLFormElement} form @param {string} unitName */
export function bindFarmAreaInputBounds(form,unitName){
 const area=form.elements.namedItem("area");
 const unit=form.elements.namedItem(unitName);
 if(!(area instanceof HTMLInputElement)||!(unit instanceof HTMLSelectElement))return;
 const sync=()=>{
  const {min,max}=farmAreaInputBounds(unit.value);
  area.min=String(min);area.max=String(max);
 };
 unit.addEventListener("change",sync);
 unit.addEventListener("input",sync);
 sync();
}
