import { readFileSync } from "node:fs";
import { routeCatalogueEvidence } from "./tractor-split-evidence-review.mjs";

function groupCandidates(records) {
  if (!Array.isArray(records)) throw new Error("Expected an array of catalogue records");
  const result = {
    releaseReview: [], requiredReview: [], heldModels: [], photoReview: [],
    heldPhotos: [], missingPhotos: [], heldClaims: [], invalidRecords: [],
  };
  for (const [index, record] of records.entries()) {
    let route;
    try {
      route = routeCatalogueEvidence(record);
    } catch (error) {
      result.invalidRecords.push({ index, reason: error.message });
      continue;
    }
    if (route.technicalRoute === "route_to_existing_release_review") {
      result.releaseReview.push(index);
    } else if (route.modelReasons.length === 1 && route.modelReasons[0] === "requiredReview"
        && record.modelGates.requiredReview === "pending") {
      result.requiredReview.push(index);
    } else {
      result.heldModels.push({ index, reasons: route.modelReasons });
    }
    if (route.photoRoute === "route_to_existing_photo_review") result.photoReview.push(index);
    else if (route.photoRoute === "research_photo") result.missingPhotos.push(index);
    else result.heldPhotos.push({ index, reasons: route.photoReasons });
    for (const { key, reasons } of route.heldClaims) result.heldClaims.push({ index, key, reasons });
  }
  return result;
}

try {
  const result = groupCandidates(JSON.parse(readFileSync(0, "utf8")));
  process.stdout.write(JSON.stringify(result, null, 2) + "\n");
  if (result.invalidRecords.length) process.exitCode = 1;
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
