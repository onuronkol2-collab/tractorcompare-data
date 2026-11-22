/**
 * Non-publishing mobile image pilot: select only THREE already public,
 * rights-reviewed Commons JPEG sources for a separate offline converter.
 * No Supabase writes, no arbitrary Commons searches, no new public srcsets.
 */
import {writeFileSync} from "node:fs";
import {resolve} from "node:path";
import {fileURLToPath} from "node:url";
import {APPROVED_TRACTOR_PHOTOS,isSupportedCommonsPhotoOrigin} from "../src/lib/tractor-photos.ts";

export const PILOT_FILE_IDS=Object.freeze([
  "belarus-80-1-nikolai-bulykin-kosmos-2026",
  "antonio-carraro-tigre-3800-439af04e",
  "new-holland-t5-110-pere-igor-2016",
]);

export function selectRightsReviewedPilot(approved=APPROVED_TRACTOR_PHOTOS){
  const selected=[];
  if(new Set(PILOT_FILE_IDS).size!==3)throw Error("Duplicate pilot file ID");
  for(const fileId of PILOT_FILE_IDS){
    const matches=approved.filter(p=>p.fileId===fileId);
    if(matches.length!==1)throw Error("Pilot file ID missing/duplicated: "+fileId);
    const photo=matches[0];
    if(!photo.brand||!photo.model||!photo.photographer||
       !/^CC BY-SA (?:3\.0|4\.0)$/.test(photo.licenseName)||
       photo.licenseUrl!=="https://creativecommons.org/licenses/by-sa/"+
         photo.licenseName.slice(-3)+"/"||
       photo.configurationExact!==false||
       !photo.sourcePage.startsWith("https://commons.wikimedia.org/wiki/File:")||
       !photo.displayUrl.endsWith(fileId+"-960.jpg")||
       !isSupportedCommonsPhotoOrigin(photo.originDisplayUrl)||
       !photo.originDisplayUrl.includes("/960px-")||
       !Number.isInteger(photo.width)||photo.width<960)
      throw Error("Pilot rights/identity gate failed: "+fileId);
    selected.push({
      fileId,brand:photo.brand,model:photo.model,
      filename:fileId+"-960.jpg",
      firstParty960:"https://tractorvs.com"+photo.displayUrl,
      commonsSource:photo.originDisplayUrl,
      sourcePage:photo.sourcePage,
      photographer:photo.photographer,
      licenseName:photo.licenseName,
      licenseUrl:photo.licenseUrl,
      sourceWidth:photo.width,sourceHeight:photo.height,
      configurationExact:photo.configurationExact,
      expectedMime:"image/jpeg"
    });
  }
  return {kind:"tractorvs-public-licensed-mobile-photo-pilot",version:1,
    expectedFiles:3,publishAllowed:false,selected};
}
const invoked=process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url);
if(invoked){
  try{
    const manifest=selectRightsReviewedPilot();
    const path=resolve(process.argv[2]||"/tmp/tractorvs-mobile-photo-pilot/approved-input.json");
    writeFileSync(path,JSON.stringify(manifest,null,2)+"\n",{flag:"w",encoding:"utf8"});
    console.log("TRACTORVS_OFFLINE_PHOTO_PILOT_INPUT "+
      JSON.stringify({fileCount:manifest.selected.length,approvedIds:manifest.selected.map(x=>x.fileId),
        publishAllowed:manifest.publishAllowed}));
  }catch(error){
    console.error("TRACTORVS_OFFLINE_PHOTO_PILOT_BLOCKED "+String(error?.message||error));
    process.exitCode=1;
  }
}
