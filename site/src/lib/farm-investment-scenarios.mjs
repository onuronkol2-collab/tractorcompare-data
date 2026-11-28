/** User-input, nominal cash-flow scenarios. No inferred prices or tax advice.
 * Separate financing cash flow from asset depreciation; never add both to TCO.
 * Annual expenses and usage are constant, currency is chosen by the caller.
 */
function bounded(value,min,max,name){
 if(typeof value!=="number"||!Number.isFinite(value)||value<min||value>max)throw new RangeError("Invalid "+name);
 return value;
}
export function investmentScenarios(input){
 const price=bounded(input.price,0,1e12,"price");
 const down=bounded(input.down,0,price,"down");
 const annualRate=bounded(input.annualRate,0,100,"annualRate");
 const term=bounded(input.termMonths,1,600,"termMonths");
 if(!Number.isInteger(term))throw new RangeError("Invalid termMonths");
 const hours=bounded(input.annualHours,0,8760,"annualHours");
 const hectares=input.annualHectares===null?null:bounded(input.annualHectares,0,1e7,"annualHectares");
 const fuel=bounded(input.fuelPerHour,0,10000,"fuelPerHour");
 const fuelPrice=bounded(input.fuelPrice,0,1e9,"fuelPrice");
 const maintenance=bounded(input.maintenancePerHour,0,1e9,"maintenancePerHour");
 const other=bounded(input.otherPerHour,0,1e9,"otherPerHour");
 const fixed=bounded(input.annualFixed,0,1e12,"annualFixed");
 const rent=input.rentalPerHour===null?null:bounded(input.rentalPerHour,0,1e9,"rentalPerHour");
 if(!Array.isArray(input.resale)||input.resale.length!==4)throw new RangeError("Four resale values required");
 const horizons=[1,3,5,10];
 const resale=horizons.map((_,i)=>input.resale[i]===null?null:bounded(input.resale[i],0,1e12,"resale"));
 const principal=price-down, rate=annualRate/1200;
 const discount=-Math.expm1(-term*Math.log1p(rate));
 // At the floating-point limit the annuity converges to equal principal payments.
 const payment=rate===0||discount===0?principal/term:principal*(rate/discount);
 if(!Number.isFinite(payment))throw new RangeError("Unrepresentable payment");
 const annualOperating=hours*(fuel*fuelPrice+maintenance+other)+fixed;
 // Amortize only as far as the longest requested horizon. Pay outstanding principal on sale.
 let balance=principal,paid=0,interest=0;
 const results=[];
 for(let month=1;month<=120;month++){
  if(month<=term&&balance>0){
   const charge=balance*rate;
   const actual=month===term?balance+charge:Math.min(payment,balance+charge);
   balance=Math.max(0,balance+charge-actual);paid+=actual;interest+=charge;
  }
  const year=month/12,index=horizons.indexOf(year);
  if(index<0)continue;
  const operating=annualOperating*year;
  const assetAndFinancing=down+paid+balance;
  const total=resale[index]===null?null:assetAndFinancing+operating-resale[index];
  const safeRatio=denominator=>{if(total===null||denominator===null||denominator===0)return null;const value=total/denominator;return Number.isFinite(value)?value:null;};
  const rental=rent===null?null:rent*hours*year;
  // One-factor fuel-price sensitivity; all other entered assumptions held fixed.
  const fuelExposure=hours*fuel*fuelPrice*year;
  const fuelPriceLow=total===null?null:total-fuelExposure*0.2;
  const fuelPriceHigh=total===null?null:total+fuelExposure*0.2;
  results.push({years:year,operating,interestPaid:interest,loanPayments:paid,loanBalance:balance,
   saleProceeds:resale[index],total,perHour:safeRatio(hours*year),
   perHectare:safeRatio(hectares===null?null:hectares*year),
   fuelPriceLow,fuelPriceHigh,rental,rentalDifference:total===null||rental===null?null:total-rental});
 }
 return {monthlyPayment:payment,annualOperating,scenarios:results};
}
