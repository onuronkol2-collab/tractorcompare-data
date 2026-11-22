/** A scheduled photo discovery is not complete if any source or model failed. */
import {readFileSync} from "node:fs";
import {resolve} from "node:path";
import {fileURLToPath} from "node:url";

export function validatePhotoResearchReports(archive,live) {
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
  if(live?.runStatus==="partial")errors.push("Research report declares partial coverage");
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
    const result=validatePhotoResearchReports(archive,live);
    console.log("TRACTORVS_PHOTO_RESEARCH_QUALITY "+JSON.stringify(result));
    if(!result.ok)process.exitCode=1;
  }catch(error){
    console.error("TRACTORVS_PHOTO_RESEARCH_QUALITY_FAILED "+String(error?.message||error));
    process.exitCode=1;
  }
}
