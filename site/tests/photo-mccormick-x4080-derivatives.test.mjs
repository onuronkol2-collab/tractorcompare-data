import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync, existsSync} from "node:fs";
import {createHash} from "node:crypto";
import {LOCALES} from "../src/lib/locales.ts";
import {primaryTractorPhoto, tractorPhotos} from "../src/lib/tractor-photos.ts";
import {modelStructuredData} from "../src/lib/model-seo.ts";

const fileId = "mccormick-x4-080-mbone-agritechnica-2023";
const expectedSource = "https://commons.wikimedia.org/wiki/File:McCormick_X4.080%2C_Agritechnica_2023%2C_Hanover_%28P1140946%29.jpg";
const model = {
  tractor_id: "d0c1306b-f178-4c6e-8c2f-945e645fee79",
  slug: "mccormick-x4-080",
  brand_name: "McCormick", model_name: "X4.080",
  brand_country: "Italy", brand_website_url: null,
  market: "EU", variant: "Standard cab / EU Stage V",
  model_year: null, horsepower: null, engine: null,
  transmission: null, drivetrain: null, weight_kg: null,
  specifications: [],
};

const assetPath = (size) => new URL("../public/images/tractors/" + fileId + "-" + size + ".jpg", import.meta.url);

test("McCormick X4.080 high-resolution first-party JPEGs match signed review ledger", () => {
  const report = JSON.parse(readFileSync(new URL("../docs/photo-import-evidence-mccormick-x4080-20261123.json", import.meta.url), "utf8"));
  assert.equal(report.reviewRequired, true);
  assert.equal(report.publicationCount, 0, "Review ledger is not an image publishing authorization");
  assert.equal(report.images.length, 1);
  const source = report.images[0];
  assert.equal(source.fileId, fileId);
  assert.equal(source.photographer, "MB-one");
  assert.equal(source.license, "CC BY-SA 4.0");
  assert.equal(source.sourcePage, expectedSource);
  assert.equal(source.approvedToPublish, false);
  assert.equal(source.originBytes, 651874);
  assert.match(source.originSha256, /^[0-9a-f]{64}$/);
  assert.deepEqual(source.derivatives.map(item => item.width), [480, 960, 1920]);
  // The older 480px/720px library must remain in place. This release fills
  // ONLY the 960px and 1920px JPEGs; no low-res file is overwritten.
  assert.ok(existsSync(assetPath(480)));
  assert.ok(existsSync(new URL("../public/images/tractors/" + fileId + "-720.jpg", import.meta.url)));
  assert.ok(existsSync(new URL("../public/images/tractors/" + fileId + "-720.webp", import.meta.url)));
  for (const size of [960,1920]) {
    const asset = source.derivatives.find(item => item.width === size);
    assert.equal(asset.file, fileId + "-" + size + ".jpg");
    const data = readFileSync(assetPath(size));
    assert.equal(data.length, asset.bytes);
    assert.equal(createHash("sha256").update(data).digest("hex"), asset.sha256);
    assert.equal(data.readUInt16BE(0), 0xffd8);
    assert.equal(data.readUInt16BE(data.length - 2), 0xffd9);
  }
});

test("existing X4.080 photo retains exact family, author and ten-language ImageObject", () => {
  const photos = tractorPhotos(model);
  assert.equal(photos.length, 1, "Higher-resolution variants must not duplicate the gallery item");
  const photo = primaryTractorPhoto(model);
  assert.ok(photo);
  assert.equal(photo.fileId, fileId);
  assert.equal(photo.brand, "McCormick");
  assert.equal(photo.model, "X4.080");
  assert.equal(photo.photographer, "MB-one");
  assert.equal(photo.licenseName, "CC BY-SA 4.0");
  assert.equal(photo.sourcePage, expectedSource);
  assert.ok(photo.thumbUrl.endsWith(fileId + "-480.jpg"));
  assert.ok(photo.displayUrl.endsWith(fileId + "-960.jpg"));
  assert.ok(photo.fullUrl.endsWith(fileId + "-1920.jpg"));
  assert.equal(photo.configurationExact, false);
  for (const locale of LOCALES) {
    const graph = modelStructuredData(model, locale, "https://tractorvs.com/")["@graph"];
    const image = graph.find(node => node["@type"] === "ImageObject");
    assert.ok(image, "ImageObject missing in " + locale);
    assert.ok(image.contentUrl.endsWith(photo.fullUrl));
    assert.ok(image.thumbnailUrl.endsWith(photo.displayUrl));
    assert.equal(image.creator.name, "MB-one");
    assert.equal(image.license, photo.licenseUrl);
    assert.equal(image.acquireLicensePage, expectedSource);
  }
  for (const wrong of ["X4.080 F Cab", "X4.080 F Platform"]) {
    assert.equal(tractorPhotos({...model, model_name:wrong}).length, 0,
      "This photo must not be repurposed for an orchard F configuration");
  }
});
