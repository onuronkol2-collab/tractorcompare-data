/**
 * Existing 3 + 15 + 12 additional local, SHA-pinned, CC BY-SA 3.0/4.0 mobile derivatives. Never proxy these
 * through Commons: they were independently resized offline from the exact
 * thirty exact licensed first-party 960px JPEGs.
 *
 * Every referenced binary's exact SHA and dimensions are enforced by
 * photo-mobile-local-assets.test.mjs using the reviewed evidence ledger.
 * Other IDs and widths (especially three unpublished models) never get a local derivative route.
 */
const PILOT_IDS=Object.freeze([
  "belarus-80-1-nikolai-bulykin-kosmos-2026",
  "antonio-carraro-tigre-3800-439af04e",
  "new-holland-t5-110-pere-igor-2016",
]);
/** Second release: only fifteen photos proved visible in LIVE image-sitemap.
 * Three additional CC-audited but unpublished model photos remain excluded.
 * Every added asset has a complete SHA + licence ledger and corresponding
 * source page; variants are NOT declared to be exact.
 */
export const PUBLIC_BATCH15_IDS=Object.freeze([
 "belarus-82-1-homoatrox-2019",
 "case-ih-puma-150-chris-woodrich-2025",
 "mccormick-x5-120-marcelx42-2023",
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
 "fendt-724-vario-01a39bcb"
]);
/** Third-wave release: twelve existing public model sources with exact source
 * SHA, CC BY-SA rights proof and 24 offline JPEG/WebP derivative SHA ledgers.
 * None of the three unpublished-photo holds is included.
 */
export const PUBLIC_THIRD_WAVE12_IDS=Object.freeze([
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
const ALLOWED=new Set([...PILOT_IDS,...PUBLIC_BATCH15_IDS,...PUBLIC_THIRD_WAVE12_IDS]);
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
