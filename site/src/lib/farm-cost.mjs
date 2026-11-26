/** Metric field-capacity and user-input cost arithmetic; no inferred model consumption or prices. */
export function farmCost(input) {
 const bounds={area:[0.0001,1000000],width:[0.01,100],speed:[0.01,100],efficiency:[0.01,100],fuel:[0,10000],price:[0,1e9],annualHours:[0,8760],other:[0,1e12],fixed:[0,1e15]};
 for(const [key,[min,max]] of Object.entries(bounds)){
  const value=input[key];
  if(typeof value!=="number"||!Number.isFinite(value)||value<min||value>max)throw new RangeError("Invalid "+key);
 }
 const capacity=input.width*input.speed*input.efficiency/1000;
 const time=input.area/capacity;
 const litres=time*input.fuel;
 const hourly=input.fuel*input.price;
 const perHa=hourly/capacity;
 const annualFuel=input.annualHours*hourly;
 return {capacity,time,litres,hourly,perHa,perDekar:perHa/10,fieldCost:litres*input.price,operatingPerHa:(hourly+input.other)/capacity,operatingField:time*(hourly+input.other),annualFuel,annualTotal:input.annualHours*(hourly+input.other)+input.fixed};
}

const AREA_SQM=Object.freeze({ha:10000,decare:1000,acre:4046.8564224,m2:1,mu:10000/15,tan:991.73553719});
export function farmAreaInHectares(value,unit){if(typeof value!=="number"||!Number.isFinite(value)||value<=0||typeof unit!=="string"||!Object.hasOwn(AREA_SQM,unit))throw new RangeError("Invalid area");const ha=value*AREA_SQM[unit]/10000;if(ha<0.0001||ha>1000000)throw new RangeError("Invalid area");return ha;}
