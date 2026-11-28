/** Preserve exact catalogue keys even when different recorded markets share
 * a display translation. No geographic equivalence is inferred.
 * @param {{value:string,label:string}[]} choices
 */
export function disambiguateMarketLabels(choices){
 const counts=new Map();
 for(const choice of choices)counts.set(choice.label,(counts.get(choice.label)||0)+1);
 return choices.map(choice=>({
  ...choice,label:counts.get(choice.label)>1&&choice.value!==choice.label
   ?choice.label+" ("+choice.value+")":choice.label
 }));
}
