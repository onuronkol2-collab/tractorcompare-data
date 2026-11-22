/**
 * Six local, SHA-pinned, CC BY-SA 4.0 mobile derivatives. Never proxy these
 * through Commons: they were independently resized offline from the exact
 * three previously licensed first-party 960px JPEGs.
 *
 * Every referenced binary's exact SHA and dimensions are enforced by
 * photo-mobile-local-assets.test.mjs using the reviewed evidence ledger.
 * Other image IDs and image widths never get a local derivative route.
 */
const PILOT_IDS=Object.freeze([
  "belarus-80-1-nikolai-bulykin-kosmos-2026",
  "antonio-carraro-tigre-3800-439af04e",
  "new-holland-t5-110-pere-igor-2016",
]);
const ALLOWED=new Set(PILOT_IDS);
export function approvedMobilePhotoFormats(fileId){
  if(!ALLOWED.has(fileId))return null;
  const prefix="/images/tractors/"+fileId+"-720";
  return {jpegUrl:prefix+".jpg",webpUrl:prefix+".webp",width:720};
}
export function approvedLocalMobileAsset(pathname){
  const match=/^\/images\/tractors\/([a-z0-9-]+)-720\.(jpg|webp)$/.exec(pathname);
  if(!match||!ALLOWED.has(match[1]))return null;
  return {fileId:match[1],mime:match[2]==="jpg"?"image/jpeg":"image/webp"};
}
export const MOBILE_PILOT_IDS=PILOT_IDS;
