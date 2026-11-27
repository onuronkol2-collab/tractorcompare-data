/**
 * Explicit demand-led TractorVS brand discovery pilots.
 * No global auto-generation of thin manufacturer pages.
 * Input MUST originate from getPublicCatalog(), the reviewed published-only
 * Supabase view. A defensive status gate also rejects draft/archived rows if
 * raw data is mistakenly supplied in future refactors.
 */
export const BRAND_DISCOVERY_PILOTS=Object.freeze([
  Object.freeze({name:"McCormick",slug:"mccormick"}),
  Object.freeze({name:"Valtra",slug:"valtra"}),
  Object.freeze({name:"TAFE",slug:"tafe",minimumSourceRecords:10}),
  Object.freeze({name:"Sonalika",slug:"sonalika",minimumSourceRecords:10}),
  Object.freeze({name:"Swaraj",slug:"swaraj",minimumSourceRecords:10}),
]);
export const MIN_PUBLISHED_BRAND_MODELS=10;

export function getBrandDiscoveryPilot(slug){
  return BRAND_DISCOVERY_PILOTS.find(item=>item.slug===slug)||null;
}

export function listedBrandCollections(publicCatalog){
  const records=Array.isArray(publicCatalog)?publicCatalog:[];
  const collections=[];
  for(const pilot of BRAND_DISCOVERY_PILOTS){
    const models=records.filter(item=>
      item && item.brand_name===pilot.name &&
      (!Object.hasOwn(item,"status") || item.status==="published") &&
      typeof item.tractor_id==="string" && item.tractor_id.length>0 &&
      typeof item.model_name==="string" && item.model_name.trim().length>0 &&
      typeof item.slug==="string" && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(item.slug) &&
      Array.isArray(item.specifications));
    const ids=models.map(model=>model.tractor_id);
    const slugs=models.map(model=>model.slug);
    if(new Set(ids).size!==ids.length||new Set(slugs).size!==slugs.length)
      throw new Error("Duplicate published brand identity for "+pilot.name);
    if(models.length<MIN_PUBLISHED_BRAND_MODELS)continue;
    if(pilot.minimumSourceRecords && models.filter(model=>verifiedModelSources(model).length>0).length<pilot.minimumSourceRecords)continue;
    models.sort((a,b)=>a.model_name.localeCompare(b.model_name,"en",{numeric:true})||
      String(a.variant||"").localeCompare(String(b.variant||""),"en")||
      a.slug.localeCompare(b.slug,"en"));
    collections.push({...pilot,models});
  }
  return collections;
}

export function verifiedModelSources(model){
  const sources=new Map();
  for(const spec of Array.isArray(model?.specifications)?model.specifications:[]){
    if(!spec?.verified_at || typeof spec.source_url!=="string")continue;
    try{
      const url=new URL(spec.source_url);
      if(!["https:","http:"].includes(url.protocol)||url.username||url.password)continue;
      if(!sources.has(url.href)){
        sources.set(url.href,{url:url.href,publisher:typeof spec.source_publisher==="string"?spec.source_publisher.trim()||null:null});
      }
    }catch{continue}
  }
  return [...sources.values()];
}


/** Coverage of the public collection, not the manufacturer's whole range. */
export function brandMarketCoverage(models){
 const groups=new Map();
 for(const model of models){
  const market=typeof model.market==="string"&&model.market.trim()?model.market:null;
  const group=groups.get(market)||{market,records:0,withSources:0};
  group.records++;
  if(verifiedModelSources(model).length)group.withSources++;
  groups.set(market,group);
 }
 return [...groups.values()];
}
