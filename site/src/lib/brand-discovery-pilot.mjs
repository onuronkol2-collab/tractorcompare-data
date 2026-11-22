/**
 * Two editorially scoped TractorVS brand discovery pilots.
 * No global auto-generation of thin manufacturer pages.
 * Input MUST originate from getPublicCatalog(), the reviewed published-only
 * Supabase view. A defensive status gate also rejects draft/archived rows if
 * raw data is mistakenly supplied in future refactors.
 */
export const BRAND_DISCOVERY_PILOTS=Object.freeze([
  Object.freeze({name:"McCormick",slug:"mccormick"}),
  Object.freeze({name:"Valtra",slug:"valtra"}),
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
      typeof item.slug==="string" && item.slug.length>0 &&
      Array.isArray(item.specifications));
    const ids=models.map(model=>model.tractor_id);
    const slugs=models.map(model=>model.slug);
    if(new Set(ids).size!==ids.length||new Set(slugs).size!==slugs.length)
      throw new Error("Duplicate published brand identity for "+pilot.name);
    if(models.length<MIN_PUBLISHED_BRAND_MODELS)continue;
    models.sort((a,b)=>a.model_name.localeCompare(b.model_name,"en",{numeric:true})||
      String(a.variant||"").localeCompare(String(b.variant||""),"en")||
      a.slug.localeCompare(b.slug,"en"));
    collections.push({...pilot,models});
  }
  return collections;
}

export function verifiedModelSources(model){
  const sources=new Map();
  for(const spec of model.specifications||[]){
    if(!spec?.verified_at || typeof spec.source_url!=="string")continue;
    try{
      const url=new URL(spec.source_url);
      if(!["https:","http:"].includes(url.protocol))continue;
      if(!sources.has(url.href)){
        sources.set(url.href,{url:url.href,publisher:spec.source_publisher?.trim()||null});
      }
    }catch{continue}
  }
  return [...sources.values()];
}
