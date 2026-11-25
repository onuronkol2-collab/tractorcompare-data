/** Offline evidence routing. Advisory only: never approves, publishes, fetches or writes data.
 * Missing optional evidence does not stop unrelated work; mandatory gates remain mandatory.
 */
import { checkAutomatedNominalEvidence } from "./tractor-automated-nominal-evidence.mjs";
const claimTypes=new Set(["manufacturer_spec","independent_specification","independent_measurement","reliability","performance_superiority"]);
const statuses=new Set(["pass","fail","pending","not_applicable"]);
const textPresent=x=>typeof x==="string"&&x.trim().length>0;
function check(value,name){if(!statuses.has(value))throw Error("Invalid gate: "+name);return value==="pass";}
function allPass(obj,keys){if(!obj||typeof obj!=="object")throw Error("Missing gate group");return keys.filter(key=>!check(obj[key],key));}
export function routeCatalogueEvidence(input){
 if(!input||!Array.isArray(input.claims)||input.claims.length>2000)throw Error("Invalid claims");
 const model=input.model;
 if(!model||!textPresent(model.brand)||!textPresent(model.model)||!textPresent(model.market))throw Error("Incomplete model identity");
 const automated=input.reviewMode==="automated_nominal";
 if(input.reviewMode!=null&&!automated&&input.reviewMode!=="existing_review")throw Error("Invalid review mode");
 const common=allPass(input.modelGates,["identity","deduplication","sourceProvenance","contentQuality",...(automated?[]:["requiredReview"]),"rls","localeSeo","releaseTests"]);
 const claims=input.claims.map(claim=>{
  if(!claim||!textPresent(claim.key)||!claimTypes.has(claim.type))throw Error("Invalid claim");
  const reasons=allPass(claim.gates,["originalEvidence","modelMarketMatch","unitsAndConditions","conflictResolved"]);
  if(claim.type!=="manufacturer_spec"&&!check(claim.gates.independentEvidence,"independentEvidence"))reasons.push("independentEvidence");
  if(claim.type==="reliability"&&!check(claim.gates.observationYear2026,"observationYear2026"))reasons.push("observationYear2026");
  return {key:claim.key,type:claim.type,route:reasons.length?"hold_claim":"review_claim",evidenceLabel:claim.type==="manufacturer_spec"?"manufacturer_claim":"independent_evidence_required",reasons};
 });
 if(new Set(claims.map(x=>x.key)).size!==claims.length)throw Error("Duplicate claim keys");
 const core=claims.filter(x=>x.route==="review_claim");
 const held=claims.filter(x=>x.route==="hold_claim");
 // Existing catalogue gate must confirm sufficient verified coverage AFTER held claims are omitted.
 const coverage=check(input.modelGates.coverageAfterOmission,"coverageAfterOmission");
 const proofReasons=automated?checkAutomatedNominalEvidence(input,core,held):[];
 const modelReasons=[...common,...(!core.length?["no_reviewable_claims"]:[]),...(!coverage?["coverageAfterOmission"]:[]),...proofReasons];
 const automaticReleaseEligible=automated&&modelReasons.length===0;
 const technicalRoute=modelReasons.length?"hold_model":automaticReleaseEligible?"route_to_automated_nominal_release":"route_to_existing_release_review";
 const photo=input.photo;
 let photoRoute="research_photo",photoReasons=["no_candidate"];
 if(photo!=null){
  photoReasons=allPass(photo.gates,["publishedTarget","exactIdentity","commercialReuse","derivativesPermitted","attribution","originalBytes","hashVerified","decodeAndMime","assetTests"]);
  photoRoute=photoReasons.length?"hold_photo":"route_to_existing_photo_review";
 }
 return {technicalRoute,automaticReleaseEligible,decisionType:automaticReleaseEligible?"automated_evidence_review":null,modelReasons,claims:core,heldClaims:held,photoRoute,photoReasons,
  reviewOnly:true,allowedToPublish:false,publicationCount:0};
}
