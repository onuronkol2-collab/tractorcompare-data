import {catalogBrandIndex} from "./catalog-brand-index.mjs";
import {verifiedModelSources} from "./brand-discovery-pilot.mjs";

/** Only actual published, identifiable model records; no inferred markets or values. */
export function publicBrandDirectory(input){
 const rows=(Array.isArray(input)?input:[]).filter(row=>row&&
  (!Object.hasOwn(row,"status")||row.status==="published")&&
  typeof row.brand_name==="string"&&row.brand_name.trim()&&
  typeof row.tractor_id==="string"&&row.tractor_id&&
  typeof row.slug==="string"&&/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(row.slug)&&
  Array.isArray(row.specifications));
 const ids=new Set(),slugs=new Set(),groups=new Map();
 for(const row of rows){
  if(ids.has(row.tractor_id)||slugs.has(row.slug))throw Error("Duplicate public directory model identity");
  ids.add(row.tractor_id);slugs.add(row.slug);
  const name=row.brand_name.trim();
  let group=groups.get(name);
  if(!group){group={sources:0,markets:new Set(),unknownMarket:0};groups.set(name,group);}
  if(verifiedModelSources(row).length)group.sources++;
  if(typeof row.market==="string"&&row.market.trim())group.markets.add(row.market);
  else group.unknownMarket++;
 }
 return catalogBrandIndex(rows).map(brand=>{
  const group=groups.get(brand.name);
  return {...brand,withSources:group.sources,markets:[...group.markets],unknownMarket:group.unknownMarket};
 });
}
