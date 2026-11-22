/**
 * Source-of-truth audit for *claimed* image copyright ownership.
 * IMPORTANT: This confirms the ORIGINAL COMMONS UPLOADER SELF-DECLARATION,
 * not a legal guarantee about later transfers. Do not confuse artist credit,
 * website watermark, model manufacturer or CC license with copyright title.
 *
 * Read ONE batched Commons API response, never 78 per-image requests.
 * Any unavailable/ambiguous source fails closed; do not fabricate ownership.
 */
import {APPROVED_TRACTOR_PHOTOS} from "../src/lib/tractor-photos.ts";
import {fetchCommonsJson} from "./photo-commons-http.mjs";

function norm(value){return String(value||"").replaceAll("_"," ").normalize("NFC").trim();}
export function reviewCommonsCopyrightWikitext(wikitext,photo){
  const body=String(wikitext||"");
  // Require a user-uploaded self-license declaration AND Own work, not
  // merely a matching attribution string from someone else's file.
  const ownWork=/(?:\|\s*source\s*=\s*(?:\{\{\s*own\b|own work)|\{\{\s*own\s*\}\})/i.test(body) ||
    /\|\s*source\s*=\s*[^\r\n]{0,180}\{\{\s*own\s*\}\}/i.test(body);
  // One legacy ru.wikipedia -> Commons transfer embeds the self-license after
  // a nested author template. Require the precise uploader, project and terms.
  const originalUploaderSelf=photo.fileId==="belarus-132n-picture30-2011" &&
    /\{\{\s*self\s*\|\s*author\s*=\s*\{\{\s*user at project\s*\|\s*Picture30\s*\|\s*wikipedia\s*\|\s*ru\s*\}\}\s*\|\s*GFDL\s*\|\s*CC-BY-SA-3\.0\b/i.test(body);
  const ownLicense=/\{\{\s*self\s*\|[^\n}]{0,160}\bcc-by-sa-4\.0\b/i.test(body) ||
    originalUploaderSelf;
  const author=String(photo.copyrightOwner||"");
  const authorAliases=photo.fileId==="steyr-4075-kompakt-joachim-2018"
    ? ["JoachimKohlerBremen","JoachimKohler-HB"]
    : [author];
  // The claimed owner must be named in the ORIGINAL file's author= field.
  // A name mentioned in a description, unrelated credit or comment is not proof.
  // Only the exact author= field is eligible, not a body-wide credit.
  // Unicode-safe boundaries allow documented author names such as Bene Riobó.
  const authorField=(body.match(/(?:^|\n)\s*\|\s*author\s*=\s*([^\r\n]{0,650})/i)||[])[1]||"";
  const normalizeAuthor=value=>String(value||"").replaceAll("_"," ").normalize("NFC").trim().toLocaleLowerCase("en");
  const authorPresent=authorAliases.some(alias=>{
    const haystack=normalizeAuthor(authorField),needle=normalizeAuthor(alias);
    const pos=haystack.indexOf(needle);
    return Boolean(needle&&pos>=0
      &&(pos===0||!(/[\p{L}\p{N}]/u).test(haystack[pos-1]))
      &&(pos+needle.length===haystack.length||!(/[\p{L}\p{N}]/u).test(haystack[pos+needle.length])));
  });
  const originalUploaderAuthor=photo.fileId!=="belarus-132n-picture30-2011" ||
    /\|\s*author\s*=\s*\{\{\s*user at project\s*\|\s*Picture30\s*\|\s*wikipedia\s*\|\s*ru\s*\}\}/i.test(body);
  const sourceUrlSame=photo.copyrightClaimUrl===photo.sourcePage
    && /^https:\/\/commons\.wikimedia\.org\/wiki\/File:[^?#]+$/.test(photo.sourcePage);
  const hasApprovedLicense=photo.licenseUrl==="https://creativecommons.org/licenses/by-sa/4.0/" ||
    (originalUploaderSelf && photo.licenseName==="CC BY-SA 3.0" &&
      photo.licenseUrl==="https://creativecommons.org/licenses/by-sa/3.0/");
  const claimIsAuthor=photo.photographer===author;
  return {fileId:photo.fileId,owner:author,sourceUrl:photo.sourcePage,
    ownWork,ownLicense,authorPresent,originalUploaderAuthor,sourceUrlSame,hasApprovedLicense,claimIsAuthor,
    verified:ownWork&&ownLicense&&authorPresent&&originalUploaderAuthor&&sourceUrlSame&&hasApprovedLicense&&claimIsAuthor};
}

export async function verifyCommonsCopyrightClaims({fetchJson=fetchCommonsJson}={}){
  const candidates=APPROVED_TRACTOR_PHOTOS.filter(photo=>photo.copyrightOwner);
  const duplicate=new Set();
  if(!candidates.length)throw Error("No approved copyright claims to verify");
  for(const p of candidates){
    if(duplicate.has(p.fileId))throw Error("Duplicate copyright file id "+p.fileId);
    duplicate.add(p.fileId);
    if(p.copyrightEvidence!=="commons-own-work-self-license" ||
      p.copyrightClaimUrl!==p.sourcePage || p.licenseName==="CC0")
      throw Error("Unapproved copyright claim evidence "+p.fileId);
  }
  const titles=candidates.map(photo=>norm(decodeURIComponent(photo.sourcePage.split("/wiki/")[1])));
  const url=new URL("https://commons.wikimedia.org/w/api.php");
  url.searchParams.set("action","query");url.searchParams.set("prop","revisions");
  url.searchParams.set("rvprop","content");url.searchParams.set("rvslots","main");
  url.searchParams.set("format","json");url.searchParams.set("formatversion","2");
  url.searchParams.set("titles",titles.join("|"));url.searchParams.set("maxlag","5");
  const json=await fetchJson(url.toString());
  const pages=json?.query?.pages;
  if(!Array.isArray(pages))throw Error("Commons API missing revision page evidence");
  const outputs=[];
  for(const photo of candidates){
    const expected=norm(decodeURIComponent(photo.sourcePage.split("/wiki/")[1]));
    const page=pages.find(v=>norm(v.title).toLowerCase()===expected.toLowerCase());
    if(!page||page.missing)throw Error("Commons file page missing: "+photo.fileId);
    const wikitext=page?.revisions?.[0]?.slots?.main?.content ??
      page?.revisions?.[0]?.slots?.main?.["*"] ??
      page?.revisions?.[0]?.["*"];
    const status=reviewCommonsCopyrightWikitext(wikitext,photo);
    outputs.push(status);
    console.log("TRACTOR_IMAGE_COPYRIGHT_SOURCE "+JSON.stringify(status));
  }
  if(outputs.some(v=>!v.verified))
    throw Error("At least one image does not contain the expected self-owned, self-licensed Commons evidence");
  console.log("TRACTOR_IMAGE_COPYRIGHT_SOURCE_SUMMARY "+JSON.stringify({audited:outputs.length,verified:outputs.length}));
  return outputs;
}
if(import.meta.url===new URL("file://"+process.argv[1]).href){
  try{await verifyCommonsCopyrightClaims();}
  catch(error){console.error("TRACTOR_IMAGE_COPYRIGHT_SOURCE_FAILED "+String(error?.message||error));process.exitCode=1;}
}
