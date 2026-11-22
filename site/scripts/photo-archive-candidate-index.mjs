/**
 * Reuse independently queried Wikimedia Commons brand research from the SAME
 * workflow run. This avoids one unauthenticated API call per published tractor.
 *
 * Discovery is title-based and non-exhaustive: a missing match does not prove
 * there is no licensed photograph. No photo is approved or published here.
 */
import {matchesPhotoFileModel} from "./photo-model-identity.mjs";
import {matchesManufacturerPhotoAlias} from "./photo-model-aliases.mjs";
import {allowedPhotoReuseLicense} from "./photo-license-check.mjs";

const norm=s=>String(s||"").normalize("NFKD").replace(/[\u0300-\u036f]/g,"")
  .toLowerCase().replace(/\u0131/g,"i").replace(/[^a-z0-9]+/g,"");

export function indexArchivePhotoCandidates(report) {
  if(!report || !Number.isSafeInteger(report.modelCount) || report.modelCount<1 ||
     !Array.isArray(report.models) || report.models.length!==report.modelCount ||
     !Array.isArray(report.errors) || report.errorCount!==report.errors.length ||
     report.errorCount!==0)
    throw Error("Archive source evidence is missing or incomplete; public photo research blocked");
  const byBrand=new Map();
  for(const row of report.models){
    if(!row?.brand || !row?.model || !Array.isArray(row.photos))
      throw Error("Malformed archive model photo research row");
    const key=norm(row.brand);
    if(!byBrand.has(key))byBrand.set(key,new Map());
    for(const p of row.photos){
      if(!p?.fileTitle || !p?.photo || !p?.photographer ||
         !allowedPhotoReuseLicense(p.license,p.licenseUrl))continue;
      byBrand.get(key).set(p.fileTitle,p);
    }
  }
  return byBrand;
}

export function archiveCandidatesForModel(index,record){
  const photos=[...(index.get(norm(record.brand))?.values()||[])];
  const candidates=photos.filter(p=>
    matchesPhotoFileModel(record.brand,record.model,p.fileTitle) ||
    matchesManufacturerPhotoAlias(record.brand,record.model,p.fileTitle)
  ).map(p=>({
    fileTitle:p.fileTitle,url:p.photo,thumbnail:p.thumbnail||null,
    descriptionUrl:p.page||null,
    mime:"image/jpeg",width:p.width||null,height:p.height||null,
    photographer:p.photographer,license:p.license,licenseUrl:p.licenseUrl,
    modelTextMatch:true,reuseLicensePermitted:true,
    reviewStatus:"human_review_required"
  })).slice(0,12);
  return {search:"same-run archival brand index: "+record.brand+" "+record.model,
    matches:candidates.length,candidates};
}
