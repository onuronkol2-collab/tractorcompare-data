/** Offline research triage, never an import or publication decision. */
const present=x=>typeof x==="string"&&x.trim().length>0&&x.length<=1000;
function httpsUrl(raw){
 if(!present(raw))return false;
 try{const u=new URL(raw);return u.protocol==="https:"&&!u.username&&!u.password&&!!u.hostname;}catch{return false;}
}
export function triageResearchPacket(packet){
 if(!packet||packet.schema!=="tractorvs-research-evidence-v1"||packet.status!=="research_only_not_importable"||!Array.isArray(packet.models)||packet.models.length>2000)throw new Error("Invalid research packet");
 const seen=new Set(),draftIds=new Map(),rows=[];
 for(const m of packet.models){
  if(!m||m.disposition!=="hold_for_review"||!["brand","model","market","variant"].every(k=>present(m[k]))||!httpsUrl(m.sourceUrl)||m.sourceType!=="manufacturer"||!Array.isArray(m.specs)||m.specs.length>2000)throw new Error("Invalid held model");
  const key=JSON.stringify([m.brand,m.model,m.variant,m.market,m.modelYear??null].map(x=>typeof x==="string"?x.normalize("NFC").trim().toLowerCase():x));
  const reasons=["requires_original_source_and_identity_review","requires_existing_admission_gates"];
  if(seen.has(key))reasons.push("repeated_identity");seen.add(key);
  if(m.existingDraftId!=null){
   if(typeof m.existingDraftId!=="string"||!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(m.existingDraftId))throw new Error("Invalid draft ID");
   if(draftIds.has(m.existingDraftId))reasons.push("repeated_draft_reference");
   draftIds.set(m.existingDraftId,key);
  }
  const fields=new Map();
  for(const s of m.specs){
   if(!s||!present(s.name)||!present(s.value)||!present(s.locator)||(s.unit!=null&&!present(s.unit))||(s.context!=null&&!present(s.context))||(s.sourceUrl!=null&&!httpsUrl(s.sourceUrl)))throw new Error("Invalid observation");
   const k=JSON.stringify([s.name,s.unit??null,s.context??null]);
   if(fields.has(k))reasons.push(fields.get(k)===s.value?"repeated_observation":"conflicting_observation");
   fields.set(k,s.value);
  }
  if(!m.specs.length)reasons.push("no_observations");
  if(m.specs.length<5)reasons.push("limited_field_coverage");
  if(/screenshot (?:failed|unavailable)|screenshot.*not accessible|search.index/i.test(m.sourceRead??""))reasons.push("original_visual_or_source_pending");
  rows.push({brand:m.brand,model:m.model,variant:m.variant,market:m.market,observationCount:m.specs.length,reasons:[...new Set(reasons)],state:"held"});
 }
 return {rows,models:rows.length,observations:rows.reduce((n,m)=>n+m.observationCount,0),allowedToPublish:false,publicationCount:0};
}
