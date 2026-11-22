/**
 * Construct one Commons brand-query plan from two independent identities:
 * historical tractor archive AND current public sitemap. Never omit newly
 * published models just because the archive snapshot is older.
 */
const norm=s=>String(s||"").normalize("NFKD").replace(/[\u0300-\u036f]/g,"")
 .toLowerCase().replace(/\u0131/g,"i").replace(/[^a-z0-9]+/g,"");
export const photoResearchKey=r=>norm(r.brand)+"|"+norm(r.model);

export function mergePhotoResearchModels(archiveRows,publishedRows) {
  if(!Array.isArray(archiveRows)||!archiveRows.length||
     !Array.isArray(publishedRows)||!publishedRows.length)
    throw Error("Historical and published photo research inventories required");
  const historical=new Map(),publicModels=new Map();
  for(const row of archiveRows){
    if(!row?.brand||!row?.model)throw Error("Archive model identity missing");
    const k=photoResearchKey(row);
    if(!historical.has(k))historical.set(k,{brand:row.brand,model:row.model});
  }
  for(const row of publishedRows){
    if(row?.status!=="published"||!row?.brand||!row?.model||
       !row.pageUrl||!row.tractor_id||row.error)
      throw Error("Published model identity must come from verified public sitemap");
    const k=photoResearchKey(row);
    if(!publicModels.has(k))publicModels.set(k,{brand:row.brand,model:row.model});
  }
  return {historical,publicModels,unique:new Map([...historical,...publicModels])};
}
