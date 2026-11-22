/**
 * Compare every public source identity + page to same-run photo report.
 * A high enough total (e.g. 388) cannot prove there are no missing records.
 * Only public sitemap-verified identities may appear in public reports.
 */
const norm=s=>String(s??"").normalize("NFKD")
  .replace(/[\u0300-\u036f]/g,"").replace(/\u0131/g,"i")
  .toLowerCase().replace(/[^a-z0-9]+/g,"");
const modelKey=x=>norm(x.brand)+"|"+norm(x.model);
const same=(a,b)=>JSON.stringify([...a].sort())===JSON.stringify([...b].sort());

export function verifyExactPublishedPhotoCoverage(inventory,publicCandidates,live){
  const errors=[];
  if(!Array.isArray(inventory)||!inventory.length)
    return {ok:false,errors:["Missing published sitemap identity inventory"]};
  if(!publicCandidates||!Array.isArray(publicCandidates.models))
    return {ok:false,errors:["Missing public brand candidate evidence"]};
  if(!live||!Array.isArray(live.models))
    return {ok:false,errors:["Missing final public model research report"]};

  const byId=new Map(),uniqueKeys=new Set();
  for(const row of inventory){
    if(row?.status!=="published"||!row.tractor_id||!row.brand||
       !row.model||!row.pageUrl)
      {errors.push("Invalid public sitemap identity row");continue;}
    const key=modelKey(row),id=String(row.tractor_id);
    uniqueKeys.add(key);
    const prior=byId.get(id);
    if(prior&&prior.key!==key){errors.push("Conflicting model identity for "+id);continue;}
    if(!prior)byId.set(id,{key,pages:[]});
    byId.get(id).pages.push(row.pageUrl);
  }

  const reportIds=new Set();
  for(const record of live.models){
    if(record?.status!=="published"||!record.tractor_id||
      !record.brand||!record.model||!Array.isArray(record.publicPages)||
      !Array.isArray(record.candidates))
      {errors.push("Invalid published photo research row");continue;}
    const id=String(record.tractor_id);
    if(reportIds.has(id)){errors.push("Duplicate published report identity "+id);continue;}
    reportIds.add(id);
    const src=byId.get(id);
    if(!src){errors.push("Report contains unverified public identity "+id);continue;}
    if(src.key!==modelKey(record))
      errors.push("Model identity drift for "+id);
    if(!same(src.pages,record.publicPages))
      errors.push("Public model page mismatch for "+id);
  }
  for(const id of byId.keys()){
    if(!reportIds.has(id))errors.push("Published model silently missing from report "+id);
  }

  const candidateKeys=new Set();
  for(const row of publicCandidates.models){
    if(!row?.brand||!row.model||!Array.isArray(row.photos)){
      errors.push("Invalid public brand evidence row");continue;
    }
    const key=modelKey(row);
    if(candidateKeys.has(key))errors.push("Duplicate public brand candidate key "+key);
    candidateKeys.add(key);
  }
  for(const key of uniqueKeys){
    if(!candidateKeys.has(key))errors.push("Public brand candidate evidence missing for "+key);
  }
  for(const key of candidateKeys){
    if(!uniqueKeys.has(key))errors.push("Unexpected public brand candidate model "+key);
  }
  if(live.publicModelPages!==inventory.length)
    errors.push("Public page inventory count mismatch");
  if(live.modelSearches!==byId.size)
    errors.push("Published unique ID count mismatch");
  if(publicCandidates.modelCount!==uniqueKeys.size)
    errors.push("Public brand/model evidence count mismatch");
  if(publicCandidates.errorCount!==0||!Array.isArray(publicCandidates.errors)||
    publicCandidates.errors.length!==0)
    errors.push("Public brand evidence has source errors");
  return {ok:errors.length===0,errors,publicPageRows:inventory.length,
    modelIds:byId.size,brandModelPairs:uniqueKeys.size};
}
