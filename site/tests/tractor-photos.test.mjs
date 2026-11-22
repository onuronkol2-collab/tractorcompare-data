import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {createHash} from "node:crypto";
import {LOCALES} from "../src/lib/locales.ts";
import {APPROVED_TRACTOR_PHOTOS,tractorPhotos,primaryTractorPhoto,photoText,tractorPhotoAlt,resolveApprovedPhotoSource} from "../src/lib/tractor-photos.ts";
import {modelStructuredData} from "../src/lib/model-seo.ts";
import {HISTORICAL_LICENSED_PHOTOS} from "../src/lib/historical-licensed-photos.ts";
const file=p=>readFileSync(new URL("../src/"+p,import.meta.url),"utf8");
const tractor=(brand_name,model_name)=>({
  tractor_id:"1a2b3c4d-1234-5678-90ab-abcdef012345",slug:"test-model",
  brand_name,model_name,brand_country:null,brand_website_url:null,
  market:"global",variant:"D-243 specification",model_year:null,horsepower:null,
  engine:null,transmission:null,drivetrain:null,weight_kg:null,specifications:[]
});
test("only exact matching tractor model identity receives a verified photo",()=>{
  assert.equal(APPROVED_TRACTOR_PHOTOS.length,78);
  assert.equal(tractorPhotos(tractor("Belarus","82.1")).length,4);
  assert.equal(tractorPhotos(tractor("Belarus","80.1")).length,1);
  assert.equal(tractorPhotos(tractor("Belarus","132N")).length,1);
  assert.equal(tractorPhotos(tractor("Belarus","152")).length,1);
  assert.equal(tractorPhotos(tractor("New Holland","T5.110")).length,1);
  assert.equal(tractorPhotos(tractor("New Holland","T6.180")).length,1);
  assert.equal(tractorPhotos(tractor("Case IH","Puma 150")).length,1);
  assert.equal(tractorPhotos(tractor("McCormick","X5.120")).length,0);
  assert.equal(tractorPhotos(tractor("McCormick","X5.120 P3-Drive")).length,1);
  assert.equal(tractorPhotos(tractor("McCormick","X5.110")).length,0);
  assert.equal(tractorPhotos(tractor("McCormick","X5.110 HC")).length,1);
  assert.equal(tractorPhotos(tractor("Landini","5-110")).length,0);
  assert.equal(tractorPhotos(tractor("Landini","5-110 RoboShift")).length,1);
  assert.equal(tractorPhotos(tractor("Fendt","724 Vario")).length,1);
  assert.equal(tractorPhotos(tractor("Valtra","Q265")).length,1);
  assert.equal(tractorPhotos(tractor("Başak Traktör","5120")).length,1);
  assert.equal(tractorPhotos(tractor("Valtra","Q266")).length,0);
  assert.equal(tractorPhotos(tractor("Case IH","Puma 155")).length,0);
  assert.equal(primaryTractorPhoto(tractor("Unknown Brand","X")),null);
});
test("new Belarus photographs keep exact model names and rights credit", () => {
  const photo132=tractorPhotos(tractor("Belarus","132N"))[0];
  const photo152=tractorPhotos(tractor("Belarus","152"))[0];
  assert.equal(photo132.photographer,"Picture30");
  assert.equal(photo152.photographer,"Homoatrox");
  assert.equal(photo132.licenseName,"CC BY-SA 3.0");
  assert.equal(photo152.licenseName,"CC BY-SA 3.0");
  assert.match(photo132.originFullUrl,/Belarus-132N\.jpg$/);
  assert.match(photo152.originFullUrl,/Belarus_152_tractor_%28Belagro-2021%29\.jpg$/);
  assert.equal(photo132.configurationExact,false);
  assert.equal(photo152.configurationExact,false);
});

test("six additional Commons photos match exact published identities and independently recorded rights",()=>{
  const reviewed=[
    ["Belarus","1220.4","Dgolnik","CC BY-SA 3.0","Belarus_1220.4.jpg"],
    ["Belarus","1221.3","Homoatrox","CC BY-SA 3.0","Belarus_MTZ-1221_3_tractor.jpg"],
    ["Belarus","622","Homoatrox","CC BY-SA 3.0","Belarus_622_tractor.jpg"],
    ["Belarus","920.2","Homoatrox","CC BY-SA 3.0","Belarus_920.2_tractor.jpg"],
    ["Belarus","952.4","Homoatrox","CC BY-SA 3.0","Belarus_952.4_tractor.jpg"],
    ["Steyr","4120 PLUS","MarcelX42","CC BY-SA 4.0","Steyr_4120_Plus_Agritechnica_2023_%28DSC05974%29.jpg"],
  ];
  for(const [brand,model,creator,license,sourceFile] of reviewed){
    const photos=tractorPhotos(tractor(brand,model));
    assert.equal(photos.length,1,brand+" "+model);
    const photo=photos[0];
    assert.equal(photo.photographer,creator);
    assert.equal(photo.licenseName,license);
    assert.ok(photo.sourcePage.endsWith(sourceFile),photo.sourcePage);
    assert.match(photo.originThumbUrl,/\/500px-/);
    assert.equal(photo.configurationExact,false);
  }
  for(const [brand,model] of [
    ["Belarus","1220.3"],["Belarus","1221.7"],["Belarus","920"],
    ["Steyr","4120 EXPERT CVT"],["Steyr","4120"],
  ]) assert.equal(tractorPhotos(tractor(brand,model)).length,0,
    "Do not spread a photograph to a different model or version");
});

test("new CC BY-SA photos preserve three exact Belarus identities, author and reuse terms",()=>{
  const verified=[
    ["892","Ivan2010","CC BY-SA 4.0","Tractor_arando_la_tierra_para_cultivo.jpg"],
    ["892.2","Globetrotter19","CC BY-SA 4.0","Belarus_892.2%2C_2025_Dunapataj.jpg"],
    ["952","Fraxinus Croat","CC BY-SA 3.0","Belarus_952.jpg"],
  ];
  for(const [model,artist,license,file] of verified){
    const record=tractorPhotos(tractor("Belarus",model));
    assert.equal(record.length,1,"One reviewed photo for Belarus "+model);
    const photo=record[0];
    assert.equal(photo.photographer,artist);
    assert.equal(photo.licenseName,license);
    assert.equal(photo.configurationExact,false);
    assert.equal(photo.sourcePage.slice(-file.length),file);
    assert.match(photo.originThumbUrl,/\/500px-/);
  }
  for(const wrong of ["892.3","922","922.3","922.4","952.2","952.4x"])
    assert.equal(primaryTractorPhoto(tractor("Belarus",wrong)),null,
      "Different model or variant must not inherit image: "+wrong);
});

test("eight new verified photos preserve signed source ledger and exact model identity",()=>{
  const evidence=JSON.parse(readFileSync(new URL("../docs/photo-review-evidence-20261121.json",import.meta.url),"utf8"));
  assert.equal(evidence.approved.length,8);
  assert.equal(evidence.rejected.length,1);
  assert.equal(evidence.rejected[0].fileId,"belarus-922-3-bulykin-almaty-2026",
    "Identity-ambiguous Belarus 922.3 photo must not be published");
  for(const source of evidence.approved){
    const photos=tractorPhotos(tractor(source.brand,source.model));
    assert.equal(photos.length,1,source.brand+" "+source.model);
    const p=photos[0];
    assert.equal(p.fileId,source.fileId);
    assert.equal(p.photographer,source.photographer);
    assert.equal(p.licenseName,source.license);
    assert.equal(p.configurationExact,false);
    assert.match(p.sourcePage,/^https:\/\/commons\.wikimedia\.org\/wiki\/File:/);
    assert.equal(decodeURIComponent(p.sourcePage.slice(p.sourcePage.lastIndexOf("/")+1)),
      decodeURIComponent("File:"+source.commonsPath.split("/").at(-1)));
    const bytes=readFileSync(new URL("../public"+p.thumbUrl,import.meta.url));
    assert.equal(bytes.length,source.bytes,"Documented JPEG size "+source.fileId);
    assert.equal(createHash("sha256").update(bytes).digest("hex"),source.sha256,
      "Downloaded approved source JPEG hash "+source.fileId);
    for(const locale of LOCALES){
      const image=modelStructuredData(tractor(source.brand,source.model),locale,
        "https://tractorvs.com/")["@graph"].find(x=>x["@type"]==="ImageObject");
      assert.ok(image,"Licensing metadata "+source.fileId+" "+locale);
      assert.equal(image.creator.name,p.photographer);
      assert.equal(image.acquireLicensePage,p.sourcePage);
      assert.equal(image.license,p.licenseUrl);
    }
  }
  // An unrelated version must never inherit a nearby-series thumbnail.
  for(const [brand,model] of [
    ["Steyr","4075 KOMPAKT S"],["Steyr","4105 PLUS"],
    ["Steyr","4130 EXPERT"],["Steyr","4140 PLUS"],
    ["Steyr","6280 IMPULS"],["Zetor","6171"],["Belarus","922.3"],
  ])assert.equal(primaryTractorPhoto(tractor(brand,model)),null,
    "Exact model/version protection: "+brand+" "+model);
});

test("McCormick and Belarus verified images preserve exact source, JPEG SHA-256 and 10-language license SEO",()=>{
  const evidence=JSON.parse(readFileSync(new URL(
    "../docs/photo-import-evidence-mccormick-20261121.json",import.meta.url),"utf8"));
  assert.equal(evidence.approved.length,3);
  assert.equal(evidence.rejected.length,1);
  assert.equal(evidence.rejected[0].model,"X5.085");
  assert.equal(primaryTractorPhoto(tractor("McCormick","X5.085")),null,
    "No unverified photo for McCormick X5.085");
  for(const source of evidence.approved){
    const photos=tractorPhotos(tractor(source.brand,source.model));
    assert.equal(photos.length,1,"Precisely one approved model image");
    const photo=photos[0];
    assert.equal(photo.fileId,source.fileId);
    assert.equal(photo.photographer,source.photographer);
    assert.equal(photo.licenseName,source.license);
    assert.equal(photo.licenseUrl,source.licenseUrl);
    assert.equal(photo.configurationExact,false);
    assert.equal(decodeURIComponent(photo.sourcePage),decodeURIComponent(source.originalCommonsUrl));
    const jpeg=readFileSync(new URL("../public"+photo.thumbUrl,import.meta.url));
    assert.equal(jpeg.length,source.bytes);
    assert.equal(jpeg[0],255);assert.equal(jpeg[1],216);assert.equal(jpeg.at(-1),217);
    assert.equal(createHash("sha256").update(jpeg).digest("hex"),source.sha256);
    for(const lang of LOCALES){
      const graph=modelStructuredData(tractor(source.brand,source.model),lang,
        "https://tractorvs.com/")["@graph"];
      const image=graph.find(x=>x["@type"]==="ImageObject");
      assert.ok(image,"ImageObject "+source.brand+" "+source.model+" "+lang);
      assert.equal(image.creator.name,photo.photographer);
      assert.equal(image.license,photo.licenseUrl);
      assert.equal(image.acquireLicensePage,photo.sourcePage);
    }
  }
  for(const [brand,model] of [
    ["McCormick","X4.085"],["McCormick","X8.631 P6-Drive"],
    ["McCormick","X5.085"],["Belarus","952.2"],
  ])assert.equal(primaryTractorPhoto(tractor(brand,model)),null,
    "Photo must not leak to neighbor model "+brand+" "+model);
});

test("Steyr image batch is exact-model, provenance-linked and SHA-256 checked across locales",()=>{
  const evidence=JSON.parse(readFileSync(new URL("../docs/steyr-photo-source-audit-20261121.json",import.meta.url),"utf8"));
  assert.equal(evidence.approved.length,2);
  assert.equal(evidence.rejected.length,1);
  assert.equal(evidence.rejected[0].model,"6240 ABSOLUT CVT");
  assert.equal(primaryTractorPhoto(tractor("Steyr","6240 ABSOLUT CVT")),null,
    "Ambiguous source license must not be published");
  for(const entry of evidence.approved){
    const images=tractorPhotos(tractor(entry.brand,entry.model));
    assert.equal(images.length,1,entry.brand+" "+entry.model);
    const photo=images[0];
    assert.equal(photo.fileId,entry.fileId);
    assert.equal(photo.photographer,entry.photographer);
    assert.equal(photo.licenseName,entry.license);
    assert.equal(photo.licenseUrl,entry.licenseUrl);
    assert.equal(photo.configurationExact,false);
    const expectedSource="https://commons.wikimedia.org/wiki/File:"+entry.path.split("/").at(-1);
    assert.equal(photo.sourcePage,expectedSource);
    const bytes=readFileSync(new URL("../public"+photo.thumbUrl,import.meta.url));
    assert.equal(bytes.length,entry.bytes);
    assert.equal(createHash("sha256").update(bytes).digest("hex"),entry.sha256);
    for(const lang of LOCALES){
      const image=modelStructuredData(tractor(entry.brand,entry.model),lang,
        "https://tractorvs.com/")["@graph"].find(x=>x["@type"]==="ImageObject");
      assert.ok(image,"ImageObject rights missing "+entry.model+" "+lang);
      assert.equal(image.creator.name,photo.photographer);
      assert.equal(image.acquireLicensePage,photo.sourcePage);
      assert.equal(image.license,photo.licenseUrl);
    }
  }
  for(const model of ["4085 KOMPAKT S","4080 KOMPAKT","6340 TERRUS","6240 ABSOLUT CVT"])
    assert.equal(primaryTractorPhoto(tractor("Steyr",model)),null,
      "Do not leak approved photo to unrelated model "+model);
});

test("each approved photograph has a verified model source and re-use license",()=>{
  const ids=new Set();
  for(const image of APPROVED_TRACTOR_PHOTOS){
    assert.ok(!ids.has(image.fileId));ids.add(image.fileId);
    for(const field of ["thumbUrl","displayUrl","fullUrl"])
      assert.match(image[field],/^\/images\/tractors\/[a-z0-9-]+-(480|960|1920)\.jpg$/);
    for(const field of ["originThumbUrl","originDisplayUrl","originFullUrl"])
      assert.match(image[field],/^https:\/\/upload\.wikimedia\.org\/wikipedia\/commons\//);
    assert.match(image.sourcePage,/^https:\/\/commons\.wikimedia\.org\/wiki\/File:/);
    assert.match(image.licenseUrl,/^https:\/\/creativecommons\.org\/(?:licenses\/by(?:-sa)?\/(?:2|3|4)\.0\/|publicdomain\/zero\/1\.0\/)$/);
    assert.ok(image.photographer.trim());
    assert.equal(image.configurationExact,false);
  }
});
test("the photo proxy accepts only fixed photo identities and resolutions",()=>{
  for(const photo of APPROVED_TRACTOR_PHOTOS){
    assert.equal(resolveApprovedPhotoSource(photo.thumbUrl),photo.originThumbUrl);
    assert.equal(resolveApprovedPhotoSource(photo.displayUrl),photo.originDisplayUrl);
    assert.equal(resolveApprovedPhotoSource(photo.fullUrl),photo.originFullUrl);
  }
  for(const uri of [
    "/images/tractors/missing-960.jpg",
    "/images/tractors/../../../admin",
    "/images/tractors/belarus-82-1-homoatrox-2019-999.jpg",
    "/images/tractors/https://example.com/480.jpg"
  ])assert.equal(resolveApprovedPhotoSource(uri),null);
});
test("all photo interface controls are localized to ten languages",()=>{
  assert.equal(LOCALES.length,10);
  for(const locale of LOCALES){
    for(const key of ["image","open","close","credit","representative","pending"])
      assert.ok(photoText(locale,key).length>=3,key+" "+locale);
    assert.match(tractorPhotoAlt(tractor("Belarus","82.1"),locale),/82\.1/);
  }
});
test("ImageObject includes rights and never introduces Product rich result eligibility",()=>{
  const doc=modelStructuredData(tractor("Belarus","82.1"),"tr","https://tractorvs.com/");
  const parts=doc["@graph"],thing=parts.find(x=>x["@type"]==="Thing"),
    image=parts.find(x=>x["@type"]==="ImageObject"),
    page=parts.find(x=>x["@type"]==="WebPage");
  assert.ok(image);assert.ok(thing);assert.ok(page);
  assert.equal(thing.image["@id"],image["@id"]);
  assert.equal(page.primaryImageOfPage["@id"],image["@id"]);
  assert.equal(image.creditText,"Homoatrox · CC BY-SA 3.0");
  assert.match(image.license,/creativecommons\.org/);
  assert.equal(image.acquireLicensePage,primaryTractorPhoto(tractor("Belarus","82.1")).sourcePage);
  assert.match(image.acquireLicensePage,/^https:\/\/commons\.wikimedia\.org\/wiki\/File:/);
  assert.equal(image.url,undefined,"Commons file description is a licensing page, not the original image URL");
  assert.equal(image.copyrightNotice,undefined,
    "Do not invent a copyright-holder claim from a photographer credit or CC0 attribution");
  assert.match(image.caption,/Belarus 82\.1/);
  assert.ok(!parts.some(x=>["Vehicle","Product"].includes(x["@type"])));
  assert.ok(!modelStructuredData(tractor("Belarus","80.0"),"tr","https://tractorvs.com/")["@graph"]
    .some(x=>x["@type"]==="ImageObject"));
});
test("Google ImageObject licensing is model-specific across all approved Commons photographs and ten locales",()=>{
  const seen=new Set();
  for (const record of APPROVED_TRACTOR_PHOTOS) {
    assert.match(record.sourcePage,/^https:\/\/commons\.wikimedia\.org\/wiki\/File:/);
    assert.match(record.licenseUrl,/^https:\/\/creativecommons\.org\//);
    const key=record.brand+"::"+record.model;
    if(seen.has(key))continue;
    seen.add(key);
    const item=tractor(record.brand,record.model);
    const photo=primaryTractorPhoto(item);
    assert.ok(photo,"Approved photo must resolve to an exact real model: "+key);
    for(const locale of LOCALES){
      const page=modelStructuredData(item,locale,"https://tractorvs.com/");
      const image=page["@graph"].find(x=>x["@type"]==="ImageObject");
      assert.ok(image,"Missing licensed ImageObject for "+key+" "+locale);
      assert.equal(image.acquireLicensePage,photo.sourcePage,"Image-specific Commons File page "+key+" "+locale);
      assert.equal(image.license,photo.licenseUrl,"Real image license "+key+" "+locale);
      assert.equal(image.creator.name,photo.photographer);
      assert.equal(image.contentUrl,"https://tractorvs.com"+photo.fullUrl);
      assert.equal(image.copyrightNotice,undefined,
        "No unverified ownership notices, including for CC0 photos");
      assert.ok(!page["@graph"].some(x=>x["@type"]==="Product"||x["@type"]==="Vehicle"));
    }
  }
  assert.ok(seen.size>30,"Substantive catalogue photo coverage required");
});

test("known Search Console examples link to the exact photo reuse conditions, including CC0",()=>{
  for(const [brand,model] of [
    ["Valtra","G135"],["Valtra","F105"],["Valtra","N135"],
    ["Versatile","Nemesis 175"],["Versatile","Nemesis 255"]
  ]){
    const item=tractor(brand,model);
    const photo=primaryTractorPhoto(item);
    assert.ok(photo,"Search Console example must have a verified photo: "+brand+" "+model);
    const graph=modelStructuredData(item,"zh","https://tractorvs.com/")["@graph"];
    const image=graph.find(x=>x["@type"]==="ImageObject");
    assert.equal(image.acquireLicensePage,photo.sourcePage);
    assert.equal(image.license,photo.licenseUrl);
    if(model==="F105")assert.equal(photo.licenseName,"CC0");
  }
});

test("fullscreen viewer, linked credits and public image sitemap use SSR images",()=>{
  const gallery=file("components/TractorPhoto.astro"),
    lightbox=file("components/PhotoLightbox.astro"),
    detail=file("components/TractorDetail.astro"),
    catalog=file("components/TractorCatalog.astro"),
    compare=file("components/TractorComparison.astro"),
    layout=file("layouts/SiteLayout.astro"),
    sitemap=file("pages/image-sitemap.xml.ts"),
    robots=file("pages/robots.txt.ts");
  assert.match(gallery,/src=\{mode==="hero"\?photo.displayUrl:photo.thumbUrl\}/);
  assert.match(gallery,/photo\.sourcePage/);
  assert.match(gallery,/photo\.licenseUrl/);
  assert.match(lightbox,/<dialog/);
  assert.match(lightbox,/dialog\.showModal\(\)/);
  assert.match(detail,/class="model-compare-action"/);
  assert.ok(detail.indexOf('class="model-compare-action"')<detail.indexOf('<TractorPhoto'));
  assert.match(catalog,/mode="catalog"/);
  assert.match(compare,/id="tc-left-photo"/);
  assert.match(compare,/id="tc-right-photo"/);
  assert.match(layout,/<PhotoLightbox lang=\{lang\} \/>/);
  assert.match(sitemap,/for\(const tractor of catalog\.tractors\)/);
  assert.match(sitemap,/for\(const locale of LOCALES\)/);
  assert.match(robots,/image-sitemap\.xml/);
});

test("historic photo batch is staged with rights and does not create records",()=>{
  assert.equal(HISTORICAL_LICENSED_PHOTOS.length,67);
  const all=new Set(HISTORICAL_LICENSED_PHOTOS.map(x=>x.fileId));
  assert.equal(all.size,67);
  assert.ok(HISTORICAL_LICENSED_PHOTOS.every(x=>x.configurationExact===false));
  assert.ok(!HISTORICAL_LICENSED_PHOTOS.some(x=>["Product","Vehicle"].includes(x.model)));
});

test("missing photograph has readable ten-language placeholder, not a fabricated image", () => {
  const component=file("components/TractorPhoto.astro");
  const style=file("styles/tractor-photos.css");
  for(const locale of LOCALES) {
    assert.ok(photoText(locale,"pending").length >= 12, "Placeholder translation "+locale);
  }
  assert.equal(tractorPhotos(tractor("TYM","T6130")).length,0);
  assert.equal(primaryTractorPhoto(tractor("TYM","T6130")),null);
  assert.match(component,/photos\.length===0/);
  assert.match(component,/tractor-photo-placeholder/);
  assert.match(component,/photoText\(lang,"pending"\)/);
  assert.match(component,/role="note"/);
  assert.ok(component.indexOf("photos.length===0") < component.indexOf('photos.length>0'));
  assert.match(style,/tractor-photo-gallery--catalog \.tractor-photo-placeholder/);
});

test("approved mobile photo routes have a first-party JPEG in the release", () => {
  for (const photo of APPROVED_TRACTOR_PHOTOS) {
    const bytes = readFileSync(new URL("../public" + photo.thumbUrl, import.meta.url));
    assert.equal(bytes.readUInt16BE(0), 0xffd8, photo.thumbUrl);
    assert.equal(bytes.readUInt16BE(bytes.length - 2), 0xffd9, photo.thumbUrl);
  }
});


test("Google copyright notices are backed by source-specific uploader declarations in all ten locales",()=>{
 const owners=[
  ["Valtra","Q305","valtra-q305-d4c20807","MarcelX42"],
  ["McCormick","X5.110 HC","mccormick-x5-110-hc-marcelx42-2023","MarcelX42"],
  ["Steyr","4075 KOMPAKT","steyr-4075-kompakt-joachim-2018","JoachimKohlerBremen"]
 ];
 const covered=new Set();
 for(const [brand,model,fileId,owner] of owners){
  const photo=primaryTractorPhoto(tractor(brand,model));
  assert.ok(photo,brand+" "+model);
  assert.equal(photo.fileId,fileId);
  assert.equal(photo.photographer,owner);
  assert.equal(photo.copyrightOwner,owner);
  assert.equal(photo.copyrightClaimUrl,photo.sourcePage);
  assert.equal(photo.copyrightEvidence,"commons-own-work-self-license");
  assert.notEqual(photo.licenseName,"CC0");
  covered.add(fileId);
  for(const lang of LOCALES){
    const schema=modelStructuredData(tractor(brand,model),lang,
      "https://tractorvs.com/")["@graph"].find(x=>x["@type"]==="ImageObject");
    assert.equal(schema?.copyrightNotice,owner,brand+" "+model+" "+lang);
    assert.equal(schema?.creator?.name,owner);
    assert.equal(schema?.acquireLicensePage,photo.sourcePage);
    assert.equal(schema?.license,photo.licenseUrl);
    assert.ok(schema.contentUrl.endsWith(fileId+"-1920.jpg"));
  }
 }
 for(const photo of APPROVED_TRACTOR_PHOTOS){
  if(photo.copyrightOwner)assert.ok(covered.has(photo.fileId),
    "New copyright owner claims must be added to reviewed, source-specific registry and Commons proof gate");
 }
 const cc0=primaryTractorPhoto(tractor("Valtra","F105"));
 assert.equal(cc0.licenseName,"CC0");
 for(const lang of LOCALES){
  const schema=modelStructuredData(tractor("Valtra","F105"),lang,
    "https://tractorvs.com/")["@graph"].find(x=>x["@type"]==="ImageObject");
  assert.equal(schema?.copyrightNotice,undefined,"CC0 must not claim an owner");
 }
});
