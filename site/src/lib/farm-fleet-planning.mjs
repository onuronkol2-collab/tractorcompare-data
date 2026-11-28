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

/** Fractional workdays, not a calendar or weather forecast. Null means unknown. */
export function estimateSequentialWorkdays(hours,dailyHours){
 if(typeof hours!=="number"||!Number.isFinite(hours)||hours<0)throw new RangeError("Invalid work hours");
 if(dailyHours===null)return null;
 if(typeof dailyHours!=="number"||!Number.isFinite(dailyHours)||dailyHours<0.1||dailyHours>24)throw new RangeError("Invalid daily hours");
 const days=hours/dailyHours;
 if(!Number.isFinite(days))throw new RangeError("Invalid workdays");
 return days;
}

/** User-supplied sequential working window; no calendar or weather prediction. */
export function estimateFieldWindow(hours,dailyHours,days){
 const workdays=estimateSequentialWorkdays(hours,dailyHours);
 if(days===null)return {workdays,requiredDailyHours:null,availableHours:null,remainingHours:null};
 if(typeof days!=="number"||!Number.isFinite(days)||days<0.1||days>3660)throw new RangeError("Invalid available days");
 const requiredDailyHours=hours/days;
 if(!Number.isFinite(requiredDailyHours))throw new RangeError("Unrepresentable work requirement");
 const availableHours=dailyHours===null?null:days*dailyHours;
 return {workdays,requiredDailyHours,availableHours,remainingHours:availableHours===null?null:availableHours-hours};
}
