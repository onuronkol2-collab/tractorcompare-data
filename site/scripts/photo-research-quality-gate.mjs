/** A scheduled photo discovery is not complete if any source or model failed. */
import {readFileSync} from "node:fs";
import {resolve} from "node:path";
import {fileURLToPath} from "node:url";
import {verifyExactPublishedPhotoCoverage} from "./photo-exact-coverage-gate.mjs";

export function validatePhotoResearchReports(archive,live,{
  minArchiveModels=1,minPublicPages=1,minModelSearches=1
}={}) {
  const errors=[];
  const validCount=(n)=>Number.isSafeInteger(n)&&n>=0;
  if(!archive||!validCount(archive.modelCount)||archive.modelCount<1||
     !Array.isArray(archive.models)||archive.models.length!==archive.modelCount)
    errors.push("Archive report/model inventory is missing or incomplete");
  if(!archive||!validCount(archive.errorCount)||!Array.isArray(archive.errors)||
     archive.errors.length!==archive.errorCount||archive.errorCount>0)
    errors.push("Archive research has source errors or invalid error accounting");
  if(!live||!validCount(live.publicModelPages)||live.publicModelPages<1||
     !validCount(live.modelSearches)||live.modelSearches<1||
     !Array.isArray(live.models)||live.models.length!==live.modelSearches)
    errors.push("Published catalogue model research is missing or incomplete");
  if(live?.models?.some?.(x=>x.error||x.status!=="published"||
    !x.brand||!x.model||!Array.isArray(x.publicPages)||!x.publicPages.length))
    errors.push("At least one published model was not fully researched");
  if(validCount(live?.publicModelPages)&&validCount(live?.modelSearches)&&
     live.modelSearches>live.publicModelPages)
    errors.push("Research model count exceeds fetched public model pages");
  // Fail closed if a future refactor drops the status field or invents a new
  // unreviewed status. "partial" is not the only non-complete state.
  if(live?.runStatus!=="complete")
    errors.push("Research report must explicitly declare complete status");
  // Preserve a conservative historical inventory floor: on 22 Nov 2026 the
  // archive had 405 models and the public catalogue had 386 models.
  // A suddenly truncated index must not be reported as 100% success.
  if(validCount(archive?.modelCount)&&archive.modelCount<minArchiveModels)
    errors.push("Archive inventory below verified safety floor "+minArchiveModels);
  if(validCount(live?.publicModelPages)&&live.publicModelPages<minPublicPages)
    errors.push("Published model pages below verified safety floor "+minPublicPages);
  if(validCount(live?.modelSearches)&&live.modelSearches<minModelSearches)
    errors.push("Published model searches below verified safety floor "+minModelSearches);
  return {ok:errors.length===0,errors,
    archiveModels:archive?.modelCount||0,
    publicPages:live?.publicModelPages||0,
    modelSearches:live?.modelSearches||0};
}

if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  try{
    const folder=resolve(process.argv[2]||"photo-discovery-report");
    const archive=JSON.parse(readFileSync(folder+"/archived-image-candidates.json","utf8"));
    const live=JSON.parse(readFileSync(folder+"/report.json","utf8"));
    // These floors detect accidental mass catalogue truncation; amend only
    // after a verified, reviewed change in the published model inventory.
    const inventory=JSON.parse(readFileSync(folder+"/published-model-inventory.json","utf8"));
    const publicCandidates=JSON.parse(readFileSync(folder+"/public-image-candidates.json","utf8"));
    const basic=validatePhotoResearchReports(archive,live,{
      minArchiveModels:300,minPublicPages:300,minModelSearches:300
    });
    const coverage=verifyExactPublishedPhotoCoverage(inventory,publicCandidates,live);
    const result={ok:basic.ok&&coverage.ok,
      errors:[...basic.errors,...coverage.errors],
      archiveModels:basic.archiveModels,publicPages:basic.publicPages,
      modelSearches:basic.modelSearches,verifiedModelIds:coverage.modelIds,
      verifiedPublicPageRows:coverage.publicPageRows,
      verifiedPublicBrandModels:coverage.brandModelPairs};
    console.log("TRACTORVS_PHOTO_RESEARCH_QUALITY "+JSON.stringify(result));
    if(!result.ok)process.exitCode=1;
  }catch(error){
    console.error("TRACTORVS_PHOTO_RESEARCH_QUALITY_FAILED "+String(error?.message||error));
    process.exitCode=1;
  }
}
