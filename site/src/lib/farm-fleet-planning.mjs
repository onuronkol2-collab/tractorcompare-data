import {farmCost,farmAreaInHectares} from "./farm-cost.mjs";
/** Sequential independent tasks only: not a parallel dispatch or safe equipment fit certificate. */
export function planSequentialFieldWork(tasks){
 if(!Array.isArray(tasks)||tasks.length===0||tasks.length>50)throw new RangeError("Invalid task count");
 const rows=Array.from(tasks,task=>{
  if(!task||typeof task!=="object")throw new RangeError("Invalid task");
  const area=farmAreaInHectares(task.area,task.unit);
  const passes=task.passes;
  if(!Number.isInteger(passes)||passes<1||passes>100)throw new RangeError("Invalid passes");
  const result=farmCost({area,width:task.width,speed:task.speed,efficiency:task.efficiency,fuel:task.fuel,price:task.price,annualHours:0,other:task.other,fixed:0});
  return {workedAreaHa:area*passes,hours:result.time*passes,litres:result.litres*passes,operatingCost:result.operatingField*passes};
 });
 return {rows,totals:rows.reduce((a,b)=>({workedAreaHa:a.workedAreaHa+b.workedAreaHa,hours:a.hours+b.hours,litres:a.litres+b.litres,operatingCost:a.operatingCost+b.operatingCost}),{workedAreaHa:0,hours:0,litres:0,operatingCost:0})};
}
