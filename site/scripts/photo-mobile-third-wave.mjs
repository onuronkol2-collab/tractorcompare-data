/**
 * Third image-performance wave. Twelve exact photos, from eight brands, were
 * listed by the REAL live image-sitemap shortlist (Actions #45033853029).
 * All are model photos already shown on canonical public pages. This is NOT
 * approval to publish new images or rights ownership.
 */
import {provePublicUnoptimizedPhotoCandidates}
  from "./photo-public-unoptimized-candidates.mjs";
import {writeFileSync} from "node:fs";
import {resolve} from "node:path";
import {fileURLToPath} from "node:url";

export const THIRD_WAVE_IDS=Object.freeze([
  "belarus-152-homoatrox-2021",
  "belarus-922-3-bulykin-almaty-2026",
  "mahindra-jivo-245-di-d2fc00a0",
  "mccormick-x4-080-mbone-agritechnica-2023",
  "mccormick-x8-631-vt-drive-marcel-2023",
  "steyr-6200-impuls-2025",
  "steyr-6340-terrus-marcel-2023",
  "tafe-6028-m-826b548b",
  "valtra-n135-beef7a3c",
  "valtra-t215-88d0ab88",
  "versatile-nemesis-175-e95b1863",
  "zetor-6170-marcel-agritechnica-2025"
]);

export function chooseThirdWavePublicPhotos(coverage){
  if(coverage?.schema!=="tractorvs-live-unoptimized-photo-candidates-v1"||
     coverage.publicationAllowed!==false||!Array.isArray(coverage.candidates)||
     THIRD_WAVE_IDS.length!==12||new Set(THIRD_WAVE_IDS).size!==12)
    throw Error("Wrong public photo coverage evidence or cohort IDs");
  const selected=THIRD_WAVE_IDS.map(fileId=>{
    const matches=coverage.candidates.filter(x=>x.fileId===fileId);
    if(matches.length!==1)throw Error("Missing/duplicate PUBLIC photo: "+fileId);
    const p=matches[0];
    const v=/^CC BY-SA (3\.0|4\.0)$/.exec(p.licenseName)?.[1];
    if(!v||p.licenseUrl!=="https://creativecommons.org/licenses/by-sa/"+v+"/"||
       !p.photographer||!p.brand||!p.model||p.exactVariantPhoto!==false||
       p.publishAllowed!==false||p.uniqueModelVariants<1||
       !Array.isArray(p.publishedModelSlugs)||p.publishedModelSlugs.length<1||
       !p.sourcePage?.startsWith("https://commons.wikimedia.org/wiki/File:")||
       p.source960!=="https://tractorvs.com/images/tractors/"+fileId+"-960.jpg"||
       p.fullImage!=="https://tractorvs.com/images/tractors/"+fileId+"-1920.jpg")
      throw Error("Rights/publication/variant evidence incomplete: "+fileId);
    return {
      fileId,brand:p.brand,model:p.model,sourcePage:p.sourcePage,
      photographer:p.photographer,licenseName:p.licenseName,licenseUrl:p.licenseUrl,
      firstParty960:p.source960,fullImage:p.fullImage,
      publishedModelSlugs:p.publishedModelSlugs,
      configurationExact:false,expectedMime:"image/jpeg"
    };
  });
  if(new Set(selected.map(x=>x.brand)).size!==8)
    throw Error("Unexpected brand diversity in verified sample");
  return {kind:"tractorvs-third-wave-public-licensed-offline-photo-QA",
    version:1,source:"live canonical public image sitemap",
    publishAllowed:false,expectedFiles:12,selected};
}
export async function prepareThirdWaveManifest({fetchFn=fetch}={}){
  const proof=await provePublicUnoptimizedPhotoCandidates({fetchFn});
  const manifest=chooseThirdWavePublicPhotos(proof);
  console.log("TRACTORVS_THIRD_WAVE_INPUT "+
    JSON.stringify({count:manifest.selected.length,publishAllowed:false,
      brands:[...new Set(manifest.selected.map(p=>p.brand))],
      ids:manifest.selected.map(p=>p.fileId)}));
  return manifest;
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  try{
    if(process.argv.length!==3)throw Error("Expected exact new output path");
    const manifest=await prepareThirdWaveManifest();
    writeFileSync(resolve(process.argv[2]),JSON.stringify(manifest,null,2)+"\n",{flag:"wx"});
  }catch(e){
    console.error("TRACTORVS_THIRD_WAVE_PREPARE_BLOCKED "+String(e?.message||e));
    process.exitCode=1;
  }
}
