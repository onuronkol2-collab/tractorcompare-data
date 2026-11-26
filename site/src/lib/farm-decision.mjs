function number(value,min,max){if(typeof value!=="number"||!Number.isFinite(value)||value<min||value>max)throw new RangeError("Invalid number");return value;}
export function ownershipCost(x){
 const purchase=number(x.purchase,0,1e12),deposit=number(x.deposit,0,purchase),rate=number(x.rate,0,100)/1200,months=number(x.months,1,600);
 if(!Number.isInteger(months))throw new RangeError("Invalid term");
 const resale=number(x.resale,0,purchase),years=number(x.years,0.1,100),rent=number(x.rent,0,1e9),hours=number(x.hours,0,8760),operating=number(x.operating,0,1e9);
 const principal=purchase-deposit;
 const payment=rate===0?principal/months:principal*rate/(-Math.expm1(-months*Math.log1p(rate)));
 const depreciation=(purchase-resale)/years;
 return {payment,interest:Math.max(0,payment*months-principal),depreciation,ownership:depreciation+operating*hours,rental:rent*hours};
}
const power={kW:1,HP:0.7456998715822702,PS:0.73549875};
const area={ha:10000,decare:1000,acre:4046.8564224};
export function convertFarmUnit(value,unit){
 number(value,0,1e12);
 const group=Object.hasOwn(power,unit)?power:Object.hasOwn(area,unit)?area:null;
 if(!group)throw new RangeError("Invalid unit");
 return Object.fromEntries(Object.entries(group).map(([key,factor])=>[key,value*group[unit]/factor]));
}
export function implementScreen(pairs){
 if(!Array.isArray(pairs)||pairs.length!==3)return "unknown";
 let missing=false,failed=false;
 for(const pair of pairs){
  if(!Array.isArray(pair)||pair.length!==2)return "unknown";
  const [available,required]=pair;
  if(available===null||required===null){missing=true;continue;}
  if(!Number.isFinite(available)||!Number.isFinite(required)||available<0||required<0||available>1e9||required>1e9)return "unknown";
  if(available<required)failed=true;
 }
 return failed?"insufficient":missing?"unknown":"matched";
}
export function validateMaintenanceNote(value){
 if(!value||typeof value.model!=="string"||!value.model.trim()||value.model.length>80)throw new RangeError("Invalid note");
 return {model:value.model.trim(),meter:number(value.meter,0,1e7),fuel:number(value.fuel,0,1e6),cost:number(value.cost,0,1e12)};
}
