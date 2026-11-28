/** Exact recorded market; no inferred regional availability.
 * @param {{markets:string[],sourceMarkets:string[],withSources:number}} row
 * @param {string} market
 * @param {boolean} requireSource
 */
export function matchesDirectoryEvidence(row,market,requireSource){
 if(market&&!row.markets.includes(market))return false;
 if(!requireSource)return true;
 return market?row.sourceMarkets.includes(market):row.withSources>0;
}
