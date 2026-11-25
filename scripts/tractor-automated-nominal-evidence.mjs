import { createHash } from "node:crypto";

// Evidence manifest validation is deterministic and offline; source reading and
// the exact current DB snapshot must be obtained by the authorized operator.
// A matching hash is integrity evidence, never proof that the source is true.
const nominalTypes = new Set(["manufacturer_spec","independent_specification"]);
const oemTypes = new Set(["manufacturer","manufacturer_specification","manufacturer_announcement","official_product_page","official_product_specification","official_product_catalog","official_technical_specification","official_manual"]);
const independentTypes = new Set(["independent_technical_specification","independent_test_report","university_technical_report","government_technical_report"]);
const present = v => typeof v==="string" && v.trim().length>0;
const hash = v => typeof v==="string" && /^[a-f0-9]{64}$/.test(v);
const date = v => typeof v==="string" && /^\d{4}-\d{2}-\d{2}$/.test(v) && !Number.isNaN(Date.parse(v)) && new Date(v).toISOString().slice(0,10)===v;
const safeUrl = v => {try{const u=new URL(v);return u.protocol==="https:"&&!u.username&&!u.password&&!!u.hostname&&!/\s/.test(v)}catch{return false}};
const identity = m => [m?.brand,m?.model,m?.market,m?.variant,m?.modelYear??null];
const rowFields = r => [r.key,r.claimType,r.value,r.unit,r.measurementStandard,r.sourceUrl,r.sourceType,r.sourcePublisher,r.sourceLocator,r.sourceExcerpt,r.sourceCheckedOn,r.scopeNote,r.sourceSha256??null];
export function nominalEvidenceFingerprint(model,rows,omittedKeys){
  return createHash("sha256").update(JSON.stringify([identity(model),rows.map(rowFields).sort((a,b)=>a[0]<b[0]?-1:a[0]>b[0]?1:0),[...omittedKeys].sort()])).digest("hex");
}
export function checkAutomatedNominalEvidence(input,core,held){
  const proof=input.automatedEvidence;
  const reasons=[];
  if(input.modelGates.requiredReview!=="not_applicable") reasons.push("explicit_nominal_review_mode_required");
  if(!present(input.model?.variant)||!present(input.model?.market)||/^(global|unknown)$/i.test(input.model.market.trim())||/\b(pending|unresolved|possible alias|review needed)\b/i.test(input.model.variant)) reasons.push("exact_variant_market");
  if(!proof||proof.decisionType!=="automated_evidence_review"||!date(proof.checkedOn)||!Array.isArray(proof.rows)||!Array.isArray(proof.omittedKeys)) return [...reasons,"missing_evidence_manifest"];
  if(core.length<8) reasons.push("minimum_eight_verified_concepts");
  if(core.some(c=>!nominalTypes.has(c.type))) reasons.push("non_nominal_claim_retained");
  const expected=core.map(c=>c.key).sort();
  const omitted=held.map(c=>c.key).sort();
  const keys=proof.rows.map(r=>r?.key).sort();
  if(JSON.stringify(keys)!==JSON.stringify(expected)||new Set(keys).size!==keys.length) reasons.push("retained_row_coverage");
  if(JSON.stringify([...proof.omittedKeys].sort())!==JSON.stringify(omitted)||new Set(proof.omittedKeys).size!==proof.omittedKeys.length) reasons.push("omitted_row_coverage");
  if(proof.omissionVerified!=="pass") reasons.push("omission_not_verified");
  const byKey=new Map(core.map(c=>[c.key,c]));
  for(const row of proof.rows){
    const claim=byKey.get(row?.key);
    if(!row||!claim||row.claimType!==claim.type||!present(row.value)||!(row.unit===null||present(row.unit))||!present(row.measurementStandard)||!safeUrl(row.sourceUrl)||!present(row.sourcePublisher)||!present(row.sourceLocator)||!present(row.sourceExcerpt)||!date(row.sourceCheckedOn)||row.sourceCheckedOn>proof.checkedOn||!present(row.scopeNote)||JSON.stringify(identity(row.modelIdentity))!==JSON.stringify(identity(input.model))||(row.sourceSha256!=null&&!hash(row.sourceSha256))||(row.claimType==="manufacturer_spec"?!oemTypes.has(row.sourceType):!independentTypes.has(row.sourceType))) {reasons.push("invalid_row_evidence:"+String(row?.key??"missing"));continue;}
  }
  if(!reasons.length){
    const fingerprint=nominalEvidenceFingerprint(input.model,proof.rows,proof.omittedKeys);
    if(!hash(proof.reviewedFingerprint)||!hash(proof.currentFingerprint)||proof.reviewedFingerprint!==fingerprint||proof.currentFingerprint!==fingerprint) reasons.push("stale_or_mismatched_evidence_fingerprint");
  }
  return reasons;
}
