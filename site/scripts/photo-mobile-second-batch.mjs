/**
 * Explicitly chosen SECOND batch of 18 pre-approved photographic identities.
 * Zero new Wikimedia discovery, no Supabase/Cloudflare writes, no publication.
 * Keep this independent of the existing 3-photo production pilot.
 */
import {APPROVED_TRACTOR_PHOTOS,isSupportedCommonsPhotoOrigin} from "../src/lib/tractor-photos.ts";
import {approvedMobilePhotoFormats} from "../src/lib/approved-mobile-photo-assets.mjs";
import {writeFileSync} from "node:fs";
import {resolve} from "node:path";
import {fileURLToPath} from "node:url";

export const BATCH_FILE_IDS=Object.freeze([
 "belarus-82-1-homoatrox-2019",
 "new-holland-t6-180-marcelx42-2025",
 "case-ih-puma-150-chris-woodrich-2025",
 "mccormick-x5-120-marcelx42-2023",
 "landini-5-110-roboshift-marcelx42-2023",
 "mccormick-x5-110-hc-marcelx42-2023",
 "belarus-132n-picture30-2011",
 "valtra-q265-65863feb",
 "valtra-g135-9d4a4ea3",
 "valtra-q245-2d50312e",
 "valtra-q305-d4c20807",
 "basak-5120-7915e01c",
 "antonio-carraro-tony-8700-v-3a40790b",
 "tafe-7515-cab-37863e86",
 "zetor-forterra-140-346bcbde",
 "yanmar-sa222-b0cb8c8c",
 "fendt-724-vario-01a39bcb",
 "kubota-m5-112-c3be6b9d"
]);

export function selectReviewedSecondBatch(approved=APPROVED_TRACTOR_PHOTOS){
 if(BATCH_FILE_IDS.length!==18||new Set(BATCH_FILE_IDS).size!==18)
   throw Error("Second batch must contain exactly eighteen unique pinned IDs");
 const selected=BATCH_FILE_IDS.map(fileId=>{
   if(approvedMobilePhotoFormats(fileId))
     throw Error("Already-optimized image cannot be staged twice: "+fileId);
   const matches=approved.filter(p=>p.fileId===fileId);
   if(matches.length!==1)throw Error("Missing/duplicate reviewed photo: "+fileId);
   const p=matches[0];
   const licenseVersion=/^CC BY-SA (3\.0|4\.0)$/.exec(p.licenseName)?.[1];
   if(!licenseVersion||p.licenseUrl!=="https://creativecommons.org/licenses/by-sa/"+licenseVersion+"/"||
      !p.brand||!p.model||!p.photographer||p.configurationExact!==false||
      !p.sourcePage.startsWith("https://commons.wikimedia.org/wiki/File:")||
      !isSupportedCommonsPhotoOrigin(p.originDisplayUrl)||
      !p.originDisplayUrl.includes("/960px-")||
      p.displayUrl!=="/images/tractors/"+fileId+"-960.jpg"||
      !Number.isInteger(p.width)||p.width<960||
      !Number.isInteger(p.height)||p.height<200)
     throw Error("Photo identity, rights or 960px upstream not verified: "+fileId);
   return {
     fileId,brand:p.brand,model:p.model,photographer:p.photographer,
     licenseName:p.licenseName,licenseUrl:p.licenseUrl,sourcePage:p.sourcePage,
     originDisplayUrl:p.originDisplayUrl,originalWidth:p.width,
     originalHeight:p.height,configurationExact:false,
     firstParty960:"https://tractorvs.com"+p.displayUrl,expectedMime:"image/jpeg"
   };
 });
 return {kind:"tractorvs-licensed-photo-second-batch",version:1,publishAllowed:false,
   expectedFiles:18,selected};
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 try{
   const manifest=selectReviewedSecondBatch();
   if(process.argv.length!==3)throw Error("Expected exact output manifest path");
   writeFileSync(resolve(process.argv[2]),JSON.stringify(manifest,null,2)+"\n",{flag:"wx"});
   console.log("TRACTORVS_SECOND_BATCH_INPUT "+JSON.stringify({
     selected:manifest.selected.length,publishAllowed:false,
     identities:manifest.selected.map(s=>({brand:s.brand,model:s.model,fileId:s.fileId,license:s.licenseName}))
   }));
 }catch(e){console.error("TRACTORVS_SECOND_BATCH_INPUT_BLOCKED "+e.message);process.exitCode=1;}
}
