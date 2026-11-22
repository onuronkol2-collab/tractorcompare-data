/**
 * Release staging gate: choose only 15 exact, license-verified file IDs
 * which currently appear in the PUBLIC image sitemap, not draft models.
 * Three nonpublic IDs stay under an explicit prohibition.
 */
import {selectReviewedSecondBatch} from "./photo-mobile-second-batch.mjs";
import {proveLiveImageCoverage,PUBLICATION_HOLD_IDS} from "./photo-mobile-second-batch-public-coverage.mjs";
import {writeFileSync} from "node:fs";
import {resolve} from "node:path";
import {fileURLToPath} from "node:url";

export async function eligibleBatch15(){
 const publicReport=await proveLiveImageCoverage();
 const all=selectReviewedSecondBatch();
 const allowed=new Set(publicReport.eligibleForRelease);
 if(allowed.size!==15||PUBLICATION_HOLD_IDS.length!==3)
   throw Error("Live eligible release cohort differs from reviewed fifteen");
 const chosen=all.selected.filter(x=>allowed.has(x.fileId));
 if(chosen.length!==15)throw Error("Missing one or more exact public identities");
 for(const item of chosen){
   if(PUBLICATION_HOLD_IDS.includes(item.fileId))
      throw Error("Unpublished historical photo cannot be staged: "+item.fileId);
 }
 return {kind:"tractorvs-license-verified-public-batch15",version:1,
  publishAllowed:false,sourcePhotoCount:18,selectedCount:15,
  heldPhotoIds:PUBLICATION_HOLD_IDS,selected:chosen};
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 try{
  if(process.argv.length!==3)throw Error("Explicit output path required");
  const manifest=await eligibleBatch15();
  writeFileSync(resolve(process.argv[2]),JSON.stringify(manifest,null,2)+"\n",{flag:"wx"});
  console.log("TRACTORVS_RELEASE15_PUBLISHED_GATE "+
    JSON.stringify({eligible:manifest.selectedCount,held:manifest.heldPhotoIds,
      identities:manifest.selected.map(x=>x.fileId)}));
 }catch(e){console.error("TRACTORVS_RELEASE15_BLOCKED "+e.message);process.exitCode=1;}
}
