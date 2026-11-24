import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync,existsSync} from "node:fs";
import {createHash} from "node:crypto";
import {LOCALES} from "../src/lib/locales.ts";
import {APPROVED_TRACTOR_PHOTOS,tractorPhotos,primaryTractorPhoto,photoText,tractorPhotoAlt,resolveApprovedPhotoSource,isSupportedCommonsPhotoOrigin,COMMONS_THUMBNAIL_STEPS} from "../src/lib/tractor-photos.ts";
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
  assert.equal(APPROVED_TRACTOR_PHOTOS.length,110);
  assert.equal(tractorPhotos(tractor("Belarus","82.1")).length,4);
  assert.equal(tractorPhotos(tractor("Belarus","80.1")).length,1);
  assert.equal(tractorPhotos(tractor("Belarus","132N")).length,1);
  assert.equal(tractorPhotos(tractor("Belarus","152")).length,1);
  assert.equal(tractorPhotos(tractor("New Holland","T5.110")).length,1);
  assert.equal(tractorPhotos(tractor("New Holland","T6.180")).length,1);
  assert.equal(tractorPhotos(tractor("Case IH","Puma 150")).length,1);
  assert.equal(tractorPhotos(tractor("McCormick","X5.120")).length,0);
  assert.equal(tractorPhotos(tractor("McCormick","X5.120 P3-Drive")).length,1);
  // Reuse is an illustrative base-model view, not evidence of a fitted P3-Drive.
  const publishedX5120=tractor("McCormick","X5.120");
  publishedX5120.tractor_id="a02c4df2-c719-5a26-abb2-6195cb8e23e5";
  const p3=tractorPhotos(tractor("McCormick","X5.120 P3-Drive"))[0];
  assert.equal(tractorPhotos(publishedX5120).length,1);
  assert.equal(tractorPhotos(publishedX5120)[0].fileId,p3.fileId);
  assert.equal(tractorPhotos(publishedX5120)[0].configurationExact,false);
  assert.equal(tractorPhotos(tractor("McCormick","X5.120")).length,0,
    "Never leak a representative image to a different or unspecified ID");
  const wrongBase=tractor("McCormick","X5.110");
  wrongBase.tractor_id=publishedX5120.tractor_id;
  assert.equal(tractorPhotos(wrongBase).length,0,
    "Same UUID with wrong model name must never be matched");
  assert.equal(tractorPhotos(tractor("McCormick","X5.100")).length,0);
  for(const locale of LOCALES)
    assert.ok(tractorPhotoAlt(publishedX5120,locale).includes("McCormick X5.120"));
  assert.equal(tractorPhotos(tractor("McCormick","X5.110")).length,0);
  assert.equal(tractorPhotos(tractor("McCormick","X5.110 HC")).length,1);
  const landini=tractor("Landini","5-110");
  landini.tractor_id="264687c1-8dd2-5801-9e2e-11901f4acf6b";
  assert.equal(tractorPhotos(landini).length,1);
  assert.equal(tractorPhotos(tractor("Landini","5-110")).length,0,
    "An unscoped or wrong UUID must not get the reviewed RoboShift illustrative image");
  assert.equal(tractorPhotos(tractor("Landini","5-110 RoboShift")).length,0);
  assert.equal(tractorPhotos(tractor("Fendt","724 Vario")).length,1);
  assert.equal(tractorPhotos(tractor("Valtra","Q265")).length,1);
  assert.equal(tractorPhotos(tractor("Başak Traktör","5120")).length,1);
  assert.equal(tractorPhotos(tractor("Valtra","Q266")).length,0);
  assert.equal(tractorPhotos(tractor("Case IH","Puma 155")).length,0);
  assert.equal(primaryTractorPhoto(tractor("Unknown Brand","X")),null);
});
test("Forterra 140 HSX photo is scoped to HSX, never CL or HD", () => {
  // All three published UK models share the base name but have different trim.
  const variants = [
    ["CL", "33bcf1bf-275e-4737-8a61-92599756c29f", false],
    ["HD", "0a900d97-3df4-444b-a25d-2c9885683b99", false],
    ["HSX", "aabda943-446b-4543-a019-c73b743652eb", true],
  ];
  for (const [variant,id,expectPhoto] of variants) {
    const record=tractor("Zetor","FORTERRA 140");
    record.tractor_id=id;
    record.variant=variant;
    const hsx=tractorPhotos(record).filter(x=>x.fileId==="zetor-forterra-140-346bcbde");
    assert.equal(hsx.length,expectPhoto?1:0,"Licensed HSX photograph must not leak to "+variant);
    const hd=tractorPhotos(record).filter(photo=>photo.fileId==="zetor-forterra-140-hd-maindistorsion");
    assert.equal(hd.length,variant==="HD"?1:0,"HD photograph must match the HD record only");
    if (hsx.length) assert.equal(hsx[0].tractorId,id);
  }
  assert.equal(tractorPhotos(tractor("Zetor","FORTERRA 140")).length,0,
    "No photo without the exact published HSX tractor identity");
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
  for(const wrong of ["892.3","922","922.4","952.2","952.4x"])
    assert.equal(primaryTractorPhoto(tractor("Belarus",wrong)),null,
      "Different model or variant must not inherit image: "+wrong);
});

test("eight new verified photos preserve signed source ledger and exact model identity",()=>{
  const evidence=JSON.parse(readFileSync(new URL("../docs/photo-review-evidence-20261121.json",import.meta.url),"utf8"));
  assert.equal(evidence.approved.length,8);
  assert.equal(evidence.rejected.length,1);
  assert.equal(evidence.rejected[0].fileId,"belarus-922-3-bulykin-almaty-2026",
    "Historical failed Commons-title lookup stays recorded; later distinct source verification is separate");
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
    ["Steyr","6280 IMPULS"],["Zetor","6171"],
  ])assert.equal(primaryTractorPhoto(tractor(brand,model)),null,
    "Exact model/version protection: "+brand+" "+model);
});

test("McCormick and Belarus verified images preserve exact source, JPEG SHA-256 and 10-language license SEO",()=>{
  const evidence=JSON.parse(readFileSync(new URL(
    "../docs/photo-import-evidence-mccormick-20261121.json",import.meta.url),"utf8"));
  assert.equal(evidence.approved.length,3);
  assert.equal(evidence.rejected.length,1);
  assert.equal(evidence.rejected[0].model,"X5.085");
  // The 21 November rejection was a *different*, title-only candidate.
  // A new 22 November photograph passed independent source and JPEG SHA proof.
  // Preserve the old rejection as historical evidence, never publish its ID.
  assert.equal(APPROVED_TRACTOR_PHOTOS.some(p=>p.fileId===evidence.rejected[0].id),false);
  assert.equal(primaryTractorPhoto(tractor("McCormick","X5.085"))?.fileId,
    "mccormick-x5-085-mbone-2023");
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
    ["McCormick","X5.086"],["Belarus","952.2"],
  ])assert.equal(primaryTractorPhoto(tractor(brand,model)),null,
    "Photo must not leak to neighbor model "+brand+" "+model);
});

test("Steyr image batch is exact-model, provenance-linked and SHA-256 checked across locales",()=>{
  const evidence=JSON.parse(readFileSync(new URL("../docs/steyr-photo-source-audit-20261121.json",import.meta.url),"utf8"));
  assert.equal(evidence.approved.length,2);
  assert.equal(evidence.rejected.length,1);
  assert.equal(evidence.rejected[0].model,"6240 ABSOLUT CVT");
  // 2026-11-22: the former automated parser only saw the PD dedication;
  // the same exact File page also explicitly offers CC BY 4.0 and own-work evidence.
  const newLicensed6240=primaryTractorPhoto(tractor("Steyr","6240 ABSOLUT CVT"));
  assert.equal(newLicensed6240?.fileId,"steyr-6240-absolut-blonder1984-2022");
  assert.equal(newLicensed6240?.photographer,"Blonder1984");
  assert.equal(newLicensed6240?.licenseName,"CC BY 4.0");
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
  for(const model of ["4085 KOMPAKT S","4080 KOMPAKT","6340 TERRUS","6240 CVT"])
    assert.equal(primaryTractorPhoto(tractor("Steyr",model)),null,
      "Do not leak approved photo to unrelated model "+model);
});

test("two newly sourced Belarus JPEGs are real, provenance-hashed, model exact, and localized",()=>{
  const ledger=JSON.parse(readFileSync(new URL("../docs/photo-evidence-belarus-510-9223-20261122.json",import.meta.url),"utf8"));
  assert.equal(ledger.sources.length,2);
  assert.equal(ledger.importProof?.length,2,"Import workflow must verify image bytes before publication");
  assert.equal(ledger.originalBinaryHttpVerified,true);
  assert.equal(ledger.jpegContentVerified,true);
  for(const record of ledger.sources){
    const matches=tractorPhotos(tractor(record.brand,record.model));
    assert.equal(matches.length,1,record.fileId);
    const photo=matches[0];
    assert.equal(photo.fileId,record.fileId);
    assert.equal(photo.photographer,record.photographer);
    assert.equal(photo.licenseName,"CC BY-SA 4.0");
    assert.equal(photo.configurationExact,false);
    const proof=ledger.importProof.find(p=>p.fileId===record.fileId);
    assert.ok(proof,record.fileId);
    assert.equal(proof.photographer,record.photographer);
    for(const size of [480,960,1920]){
      const data=readFileSync(new URL("../public/images/tractors/"+record.fileId+"-"+size+".jpg",import.meta.url));
      assert.equal(data[0],255);assert.equal(data[1],216);assert.equal(data[2],255);
      assert.equal(data.at(-2),255);assert.equal(data.at(-1),217);
      assert.ok(data.length>9000);
      assert.equal(data.length,proof.derivatives[size].bytes);
      assert.equal(createHash("sha256").update(data).digest("hex"),proof.derivatives[size].sha256);
    }
    for(const locale of LOCALES){
      const image=modelStructuredData(tractor(record.brand,record.model),locale,"https://tractorvs.com/")
        ["@graph"].find(x=>x["@type"]==="ImageObject");
      assert.ok(image,"Model-specific image rights in locale "+locale);
      assert.equal(image.creator.name,record.photographer);
      assert.equal(image.license,record.licenseUrl);
      assert.equal(image.acquireLicensePage,photo.sourcePage);
    }
  }
  for(const model of ["510/512","922.4"]){
    assert.equal(primaryTractorPhoto(tractor("Belarus",model)),null,
      "Do not transfer a model's photograph to its adjacent variant");
  }
});

test("six CC BY-SA photos: exact models, author, 18 integrity hashes and 10 locale credits",()=>{
  let count=0;
  for(const name of ["photo-evidence-belarus-510-9223-20261122.json","photo-evidence-mccormick-four-20261122.json"]){
    const ledger=JSON.parse(readFileSync(new URL("../docs/"+name,import.meta.url),"utf8"));
    assert.equal(ledger.jpegContentVerified,true);
    assert.equal(ledger.originalBinaryHttpVerified,true);
    assert.equal(ledger.importProof.length,ledger.sources.length);
    for(const item of ledger.sources){
      count++;
      const data=tractorPhotos(tractor(item.brand,item.model));
      assert.equal(data.length,1);
      const actual=data[0];
      assert.equal(actual.fileId,item.fileId);
      assert.equal(actual.photographer,item.photographer);
      assert.equal(actual.licenseName,item.licenseName);
      assert.equal(actual.configurationExact,false);
      assert.equal(decodeURIComponent(actual.sourcePage).replaceAll("_"," "),
                   decodeURIComponent(item.sourcePage).replaceAll("_"," "));
      const proof=ledger.importProof.find(p=>p.fileId===item.fileId);
      assert.ok(proof);
      for(const size of [480,960,1920]){
        const jpeg=readFileSync(new URL("../public/images/tractors/"+item.fileId+"-"+size+".jpg",import.meta.url));
        assert.ok(jpeg.length>9000);assert.equal(jpeg.readUInt16BE(0),0xffd8);
        assert.equal(jpeg.readUInt16BE(jpeg.length-2),0xffd9);
        assert.equal(jpeg.length,proof.derivatives[size].bytes);
        assert.equal(createHash("sha256").update(jpeg).digest("hex"),proof.derivatives[size].sha256);
      }
      for(const locale of LOCALES){
        const img=modelStructuredData(tractor(item.brand,item.model),locale,
          "https://tractorvs.com/")["@graph"].find(x=>x["@type"]==="ImageObject");
        assert.ok(img);
        assert.equal(img.creator.name,item.photographer);
        assert.equal(img.license,item.licenseUrl);
        assert.equal(img.acquireLicensePage,actual.sourcePage);
        assert.equal(img.copyrightNotice,undefined);
      }
    }
  }
  assert.equal(count,6);
  for(const [brand,model] of [
    ["Belarus","922.4"],["Belarus","510/512"],
    ["McCormick","X4.085 TF"],["McCormick","X6.413 P6-Drive"],
    ["McCormick","X7.618 P6-Drive"],["McCormick","X7.624 P6-Drive"]
  ])assert.equal(primaryTractorPhoto(tractor(brand,model)),null);
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
    // Newly verified variants are UUID-scoped; synthetic tests carry the exact published ID.
    if(record.tractorId)item.tractor_id=record.tractorId;
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
      assert.equal(image.copyrightNotice,photo.copyrightOwner||undefined,
        "Only source-verified copyright owners can appear; never claim copyright on CC0");
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

test("Belarus 451, 572 and 923.4 Commons source JPG and ten-locale license evidence",()=>{
  const evidence=JSON.parse(readFileSync(new URL("../docs/photo-evidence-belarus-451-572-9234-20261122.json",import.meta.url),"utf8"));
  assert.equal(evidence.sources.length,3);
  assert.equal(evidence.importProof?.length,3,"Importer must record source integrity before release");
  for(const source of evidence.sources){
    const photo=primaryTractorPhoto(tractor(source.brand,source.model));
    assert.ok(photo,"Exact model photo: "+source.model);
    assert.equal(photo.fileId,source.fileId);
    assert.equal(photo.photographer,source.photographer);
    assert.equal(photo.licenseName,"CC BY-SA 4.0");
    assert.equal(photo.configurationExact,false);
    const proof=evidence.sha256?.[source.fileId];
    assert.ok(proof,"Missing SHA evidence: "+source.fileId);
    for(const size of [480,960,1920]){
      const p=new URL("../public/images/tractors/"+source.fileId+"-"+size+".jpg",import.meta.url);
      const binary=readFileSync(p);
      assert.equal(binary.length,proof[size].bytes);
      assert.equal(createHash("sha256").update(binary).digest("hex"),proof[size].sha256);
      assert.equal(binary[0],255); assert.equal(binary[1],216); assert.equal(binary.at(-1),217);
    }
    for(const locale of LOCALES){
      const image=modelStructuredData(tractor(source.brand,source.model),locale,"https://tractorvs.com/")["@graph"].find(x=>x["@type"]==="ImageObject");
      assert.ok(image);
      assert.equal(image.creator.name,source.photographer);
      assert.equal(image.license,source.licenseUrl);
      assert.equal(decodeURIComponent(image.acquireLicensePage),decodeURIComponent(source.sourcePage),"Both point to the exact same Commons File after percent-decoding");
    }
  }
  for(const wrong of ["451.1","572.1","923.3","923.7"])
    assert.equal(primaryTractorPhoto(tractor("Belarus",wrong)),null,"No series-wide photo inheritance");
});


test("Belarus 112N-01 own-work Commons photo has exact historical model alias proof, three SHA-256 JPEGs and ten-locale reuse metadata",()=>{
  const ledger=JSON.parse(readFileSync(new URL("../docs/photo-evidence-belarus-112n01-20261122.json",import.meta.url),"utf8"));
  assert.equal(ledger.sources.length,1);
  assert.equal(ledger.originalBinaryHttpVerified,true);
  assert.equal(ledger.jpegContentVerified,true);
  assert.equal(ledger.importProof.length,1);
  const source=ledger.sources[0],proof=ledger.importProof[0];
  assert.equal(source.brand,"Belarus"); assert.equal(source.model,"112N-01");
  assert.equal(source.photographer,"Homoatrox");
  assert.equal(source.licenseName,"CC BY-SA 3.0");
  assert.equal(source.variantExact,false);
  assert.match(source.modelIdentityEvidence,/112H-01.*112N-01/);
  const item=tractor("Belarus","112N-01");
  const p=primaryTractorPhoto(item);
  assert.ok(p); assert.equal(p.fileId,source.fileId);
  assert.equal(p.photographer,source.photographer);
  assert.equal(p.licenseName,source.licenseName);
  assert.equal(p.licenseUrl,source.licenseUrl);
  assert.equal(p.configurationExact,false);
  assert.equal(decodeURIComponent(p.sourcePage),decodeURIComponent(source.sourcePage));
  for(const size of [480,960,1920]){
    const bytes=readFileSync(new URL("../public/images/tractors/"+source.fileId+"-"+size+".jpg",import.meta.url));
    assert.equal(bytes.readUInt16BE(0),0xffd8);
    assert.equal(bytes.readUInt16BE(bytes.length-2),0xffd9);
    assert.equal(bytes.length,proof.derivatives[size].bytes);
    assert.equal(createHash("sha256").update(bytes).digest("hex"),proof.derivatives[size].sha256);
  }
  for(const lang of LOCALES){
    const image=modelStructuredData(item,lang,"https://tractorvs.com/")["@graph"].find(x=>x["@type"]==="ImageObject");
    assert.ok(image,"ImageObject in "+lang);
    assert.equal(image.creator.name,"Homoatrox");
    assert.equal(image.license,source.licenseUrl);
    assert.equal(decodeURIComponent(image.acquireLicensePage),decodeURIComponent(p.sourcePage));
    assert.equal(image.copyrightNotice,undefined,"A photo author is not automatically a legally proven copyright owner");
    assert.equal(image.contentUrl,"https://tractorvs.com"+p.fullUrl);
  }
  for(const incorrect of ["112H-01","112N","112N-02","132N"])
    assert.equal(primaryTractorPhoto(tractor("Belarus",incorrect))?.fileId===source.fileId,false,"Photo must not leak to "+incorrect);
});

test("2026-11-22 independently self-licensed Commons gallery retains exact Steyr and Zetor identities",()=>{
  const cases=[
    ["Steyr","6240 ABSOLUT CVT",["steyr-6240-absolut-blonder1984-2022"],["Blonder1984"],["CC BY 4.0"]],
    ["Zetor","PROXIMA",["zetor-proxima-jj7777-2021","zetor-proxima-raf24-warsaw-2019"],["JJ7777","Raf24~commonswiki"],["CC BY-SA 4.0","CC BY-SA 4.0"]]
  ];
  for(const [brand,model,ids,artists,licenses] of cases){
    const photos=tractorPhotos(tractor(brand,model));
    assert.deepEqual(photos.map(x=>x.fileId),ids);
    assert.deepEqual(photos.map(x=>x.photographer),artists);
    assert.deepEqual(photos.map(x=>x.licenseName),licenses);
    for(const photo of photos){
      assert.equal(photo.configurationExact,false);
      assert.match(photo.originThumbUrl,/\/500px-/);
      assert.match(photo.originDisplayUrl,/\/960px-/);
      assert.match(photo.sourcePage,/^https:\/\/commons\.wikimedia\.org\/wiki\/File:/);
      assert.equal(resolveApprovedPhotoSource(photo.thumbUrl),photo.originThumbUrl);
      assert.equal(resolveApprovedPhotoSource(photo.displayUrl),photo.originDisplayUrl);
    }
  }
  for(const [brand,model] of [["Steyr","6240 CVT"],["Steyr","6220 ABSOLUT CVT"],["Zetor","FORTERRA 130"],["Zetor","PROXIMA POWER 120"]])
    assert.equal(tractorPhotos(tractor(brand,model)).length,0,"Must not invent a pictured adjacent model "+brand+" "+model);
});

test("McCormick X5.085 and TYM T6115/T2025P have exact licensed files, source proof, and ten-language metadata",()=>{
 const ledger=JSON.parse(readFileSync(new URL("../docs/photo-import-evidence-mccormick-tym-wave2-20261122.json",import.meta.url),"utf8"));
 assert.equal(ledger.reviewRequired,true);
 assert.equal(ledger.publicationCount,0,"Staging ledger must never self-authorize publication");
 const models=[
  ["McCormick","X5.085","mccormick-x5-085-mbone-2023","MB-one"],
  ["TYM","T6115","tym-t6115-t115-marcelx42-2025","MarcelX42"],
  ["TYM","T2025P","tym-t2025p-t25-marcelx42-2025","MarcelX42"]
 ];
 assert.equal(ledger.images.length,models.length);
 for(const [brand,model,id,creator] of models){
  const list=tractorPhotos(tractor(brand,model));
  assert.equal(list.length,1,"Only one reviewed primary photo for "+brand+" "+model);
  const p=list[0],e=ledger.images.find(x=>x.fileId===id);
  assert.ok(e);
  assert.equal(p.fileId,id);
  assert.equal(p.photographer,creator);
  assert.equal(p.licenseName,"CC BY-SA 4.0");
  assert.equal(p.configurationExact,false);
  assert.equal(e.approvedToPublish,false);
  assert.equal(e.photographer,creator);
  assert.equal(e.license,"CC BY-SA 4.0");
  assert.equal(e.sourcePage,p.sourcePage);
  assert.equal(new URL(e.origin).hostname,"thumb.wikimedia.org");
  assert.equal(e.derivatives.length,3);
  for(const size of [480,960,1920]){
   const d=e.derivatives.find(x=>x.width===size);
   assert.ok(d);
   assert.equal(d.file,id+"-"+size+".jpg");
   const bytes=readFileSync(new URL("../public/images/tractors/"+d.file,import.meta.url));
   assert.equal(bytes.length,d.bytes);
   assert.equal(createHash("sha256").update(bytes).digest("hex"),d.sha256);
   assert.equal(bytes.subarray(0,3).toString("hex"),"ffd8ff");
   assert.equal(bytes.subarray(-2).toString("hex"),"ffd9");
  }
  assert.equal(resolveApprovedPhotoSource(p.thumbUrl),p.originThumbUrl);
  assert.equal(resolveApprovedPhotoSource(p.displayUrl),p.originDisplayUrl);
  for(const locale of LOCALES){
   const object=modelStructuredData(tractor(brand,model),locale,"https://tractorvs.com/")["@graph"].find(x=>x["@type"]==="ImageObject");
   assert.ok(object,"ImageObject for "+brand+" "+model+" "+locale);
   assert.equal(object.license,p.licenseUrl);
   assert.equal(object.creator.name,creator);
   assert.equal(decodeURIComponent(object.acquireLicensePage),decodeURIComponent(p.sourcePage));
   assert.equal(object.contentUrl,"https://tractorvs.com"+p.fullUrl);
  }
 }
 for(const [b,m] of [["TYM","T6130"],["TYM","T3048"],["TYM","T4049"],["McCormick","X5.080"]])
   assert.equal(tractorPhotos(tractor(b,m)).length,0,"Unapproved adjacent variant "+b+" "+m);
});

test("historic photo batch is staged with rights and does not create records",()=>{
  assert.equal(HISTORICAL_LICENSED_PHOTOS.length,95);
  const all=new Set(HISTORICAL_LICENSED_PHOTOS.map(x=>x.fileId));
  assert.equal(all.size,94);
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


test("source-backed copyright notices cover approved Google warning images in all ten locales",()=>{
 const originalThree=new Set([
  "valtra-q305-d4c20807","mccormick-x5-110-hc-marcelx42-2023",
  "steyr-4075-kompakt-joachim-2018"
 ]);
 const reviewedTwenty=new Set([
  "tafe-7515-d8c32d69","valtra-n175-e4277f5d",
  "antonio-carraro-tony-8700-v-3a40790b","tafe-7515-cab-37863e86",
  "versatile-nemesis-255-be32337e","zetor-forterra-110-536b7625",
  "tafe-6028-m-826b548b","zetor-forterra-140-346bcbde",
  "tafe-240-s-c45f9eaf","valtra-t255-622d182c",
  "versatile-nemesis-175-e95b1863","valtra-q265-65863feb",
  "fendt-724-vario-01a39bcb","valtra-g135-9d4a4ea3",
  "valtra-q245-2d50312e","valtra-n135-beef7a3c",
  "valtra-t215-88d0ab88","valtra-a105-cd63351d",
  "valtra-a85-af39c01a","valtra-a75-f99b4394"
 ]);
 const exactTym=new Set([
  "tym-t2026-2500l-marcelx42-2023",
  "tym-t4058-6225c-marcelx42-2023",
  "tym-t5075-t78-marcelx42-2023"
 ]);
 const expected=new Set([...originalThree,...reviewedTwenty,...exactTym,"zetor-forterra-140-hd-maindistorsion","belarus-132n-picture30-2011","mccormick-x7-621-barzkowice-zwiadowca21-2026","landini-5-110-roboshift-marcelx42-2023"]);
 assert.equal(expected.size,30);
 const actual=APPROVED_TRACTOR_PHOTOS.filter(p=>p.copyrightOwner);
 assert.deepEqual(new Set(actual.map(p=>p.fileId)),expected,
   "Unexpected ownership claims must undergo separate review before publication");
 for(const photo of actual){
  assert.equal(photo.photographer,photo.copyrightOwner);
  assert.equal(photo.copyrightClaimUrl,photo.sourcePage);
  assert.equal(photo.copyrightEvidence,"commons-own-work-self-license");
  assert.equal(photo.licenseName,photo.fileId==="belarus-132n-picture30-2011"?"CC BY-SA 3.0":"CC BY-SA 4.0");
  const record=tractor(photo.brand,photo.model);
  if(photo.tractorId)record.tractor_id=photo.tractorId;
  const main=primaryTractorPhoto(record);
  assert.equal(main.fileId,photo.fileId);
  for(const locale of LOCALES){
   const schema=modelStructuredData(record,locale,"https://tractorvs.com/")["@graph"]
     .find(x=>x["@type"]==="ImageObject");
   assert.equal(schema?.copyrightNotice,photo.copyrightOwner,photo.fileId+" "+locale);
   assert.equal(schema?.creator?.name,photo.photographer);
   assert.equal(schema?.acquireLicensePage,photo.sourcePage);
   assert.equal(schema?.license,photo.licenseUrl);
   assert.ok(schema?.contentUrl?.endsWith(photo.fileId+"-1920.jpg"));
  }
 }
 // Two unproved source types and one CC0 dedicaton remain deliberately unclaimed.
 for(const [brand,model] of [
  ["Swaraj","735 FE"],["Valtra","F105"]
 ]){
  const item=tractor(brand,model),photo=primaryTractorPhoto(item);
  assert.ok(photo);
  assert.equal(photo.copyrightOwner,undefined);
  for(const locale of LOCALES){
   const obj=modelStructuredData(item,locale,"https://tractorvs.com/")["@graph"]
     .find(x=>x["@type"]==="ImageObject");
   assert.equal(obj?.copyrightNotice,undefined,
     "Do not invent copyright ownership for "+brand+" "+model+" "+locale);
  }
 }
});

test("2026 Commons direct URLs use only supported fixed thumbnail widths",()=>{
  assert.deepEqual([...COMMONS_THUMBNAIL_STEPS].sort((a,b)=>a-b),
    [20,40,60,120,250,330,500,960,1280,1920,3840]);
  let checked=0;
  for(const photo of APPROVED_TRACTOR_PHOTOS){
    for(const [size,origin] of [
      [480,photo.originThumbUrl],[960,photo.originDisplayUrl],
      [1920,photo.originFullUrl]
    ]){
      assert.ok(isSupportedCommonsPhotoOrigin(origin),
        photo.fileId+" "+size+" must not silently return HTTP 400");
      assert.equal(resolveApprovedPhotoSource("/images/tractors/"+photo.fileId+"-"+size+".jpg"),origin);
      checked++;
    }
    for(const unsupportedSize of [640,720,800]){
      assert.equal(resolveApprovedPhotoSource(
        "/images/tractors/"+photo.fileId+"-"+unsupportedSize+".jpg"),null);
    }
  }
  assert.ok(checked>=150,"Must cover the whole approved photo catalogue");
});
test("Wikimedia-only upstream guard rejects arbitrary resize steps and offsite assets",()=>{
  const stem="https://upload.wikimedia.org/wikipedia/commons/thumb/5/53/Example.jpg/";
  for(const invalid of [
    stem+"640px-Example.jpg",stem+"720px-Example.jpg",stem+"800px-Example.jpg",
    "https://evil.example/wikipedia/commons/thumb/5/53/Example.jpg/960px-Example.jpg",
    "http://upload.wikimedia.org/wikipedia/commons/thumb/5/53/Example.jpg/960px-Example.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/thumb/5/53/Example.jpg/720px-Example.jpg?bypass=1",
    "javascript:alert(1)","not a url"
  ])assert.equal(isSupportedCommonsPhotoOrigin(invalid),false,invalid);
  assert.equal(isSupportedCommonsPhotoOrigin(stem+"500px-Example.jpg"),true);
  assert.equal(isSupportedCommonsPhotoOrigin(stem+"960px-Example.jpg"),true);
  assert.equal(isSupportedCommonsPhotoOrigin(stem+"1920px-Example.jpg"),true);
  assert.equal(isSupportedCommonsPhotoOrigin(
    "https://upload.wikimedia.org/wikipedia/commons/5/53/Example.jpg"),true);
});


test("Three visibly verified TYM 2500L, 6225C and T78 Commons photos publish solely on their exact variant IDs with ten-locale image rights",()=>{
  const documentation=JSON.parse(readFileSync(new URL("../docs/photo-curated-tym-exact-three-20261122.json",import.meta.url),"utf8"));
  const integrity=JSON.parse(readFileSync(new URL("../docs/photo-import-evidence-tym-exact-three-20261122.json",import.meta.url),"utf8"));
  const approved=JSON.parse(readFileSync(new URL("../docs/photo-release-evidence-tym-exact-three-20261122.json",import.meta.url),"utf8"));
  assert.equal(documentation.photos.length,3);
  assert.equal(integrity.images.length,3);
  assert.equal(approved.photos.length,3);
  assert.equal(approved.visualReviewCompleted,true);
  assert.equal(new Set(documentation.photos.map(x=>x.tractorId)).size,3);
  const matched=new Set();
  for(const row of documentation.photos){
    const relevant=tractor("TYM",row.model);
    relevant.tractor_id=row.tractorId;
    relevant.variant=row.variant;
    const photos=tractorPhotos(relevant);
    assert.equal(photos.length,1,"Exactly one source photo for the model-specific published UUID "+row.tractorId);
    const p=photos[0];
    assert.equal(p.tractorId,row.tractorId);
    assert.equal(p.fileId,row.fileId);
    assert.equal(p.sourcePage,row.sourcePage);
    assert.equal(p.photographer,row.photographer);
    assert.equal(p.copyrightOwner,row.photographer);
    assert.equal(p.copyrightClaimUrl,row.sourcePage);
    assert.equal(p.copyrightEvidence,"commons-own-work-self-license");
    assert.equal(p.configurationExact,false,"A showroom photo must not assert precise equipment trim");
    assert.equal(p.licenseName,"CC BY-SA 4.0");
    assert.equal(p.licenseUrl,row.licenseUrl);
    const audit=approved.photos.find(x=>x.fileId===p.fileId);
    assert.ok(audit?.modelBadgeVisible,"Manual image review must see the exact physical model badge");
    assert.equal(audit.tractorId,p.tractorId);
    assert.equal(audit.photographer,p.photographer);
    const stage=integrity.images.find(x=>x.fileId===p.fileId);
    assert.ok(stage);
    assert.equal(stage.photographer,p.photographer);
    assert.equal(stage.license,p.licenseName);
    assert.equal(stage.derivatives.length,3);
    for(const d of stage.derivatives){
      assert.ok([480,960,1920].includes(d.width));
      const filename="/images/tractors/"+d.file;
      assert.ok([p.thumbUrl,p.displayUrl,p.fullUrl].includes(filename));
      const bytes=readFileSync(new URL("../public"+filename,import.meta.url));
      assert.equal(bytes.length,d.bytes,filename);
      assert.equal(createHash("sha256").update(bytes).digest("hex"),d.sha256,filename);
      assert.equal(bytes[0],0xff);
      assert.equal(bytes[1],0xd8);
      assert.equal(bytes[bytes.length-2],0xff);
      assert.equal(bytes[bytes.length-1],0xd9);
    }
    for(const locale of LOCALES){
      const graph=modelStructuredData(relevant,locale,"https://tractorvs.com/")["@graph"];
      const image=graph.find(node=>node["@type"]==="ImageObject");
      assert.ok(image,"ImageObject is required in "+locale+" for "+row.model);
      assert.equal(image.creator.name,p.photographer);
      assert.equal(image.copyrightNotice,p.photographer);
      assert.equal(image.license,p.licenseUrl);
      assert.equal(image.acquireLicensePage,p.sourcePage);
      assert.ok(image.contentUrl.endsWith(p.fullUrl));
      assert.ok(image.thumbnailUrl.endsWith(p.displayUrl));
      assert.equal(graph.find(node=>node["@type"]==="WebPage").primaryImageOfPage["@id"],image["@id"]);
    }
    matched.add(p.fileId);
  }
  assert.equal(matched.size,3);
  // Do not add photos to the wrong existing variant, even when the family model_name is shared.
  for(const [model,otherId] of [
    ["T2026","37c62cc5-b235-41a6-a2f0-4a1260cf4884"],
    ["T2026","d8bd757c-17ae-4e98-9a50-1670b2574185"],
    ["T4058","82fbcc0b-d0b2-4fa2-940b-f8404c384840"],
    ["T4058","3e3c6766-5760-47d5-bcac-10a53bf8ccd2"],
    ["T4058","70765008-bf4c-42be-aadf-570d1f65c7e9"],
    ["T5075","1a2b3c4d-1234-5678-90ab-abcdef012345"],
  ]){
    const candidate=tractor("TYM",model);
    candidate.tractor_id=otherId;
    assert.equal(tractorPhotos(candidate).length,0,"No mismatch should show a photo: "+model+" "+otherId);
    const graph=modelStructuredData(candidate,"en","https://tractorvs.com/")["@graph"];
    assert.equal(graph.some(node=>node["@type"]==="ImageObject"),false);
  }
});


test("McCormick X4.080 exact high-resolution files are real SHA-verified first-party JPEGs",()=>{
 const id="mccormick-x4-080-mbone-agritechnica-2023";
 const data=JSON.parse(readFileSync(new URL("../docs/photo-import-evidence-mccormick-x4080-20261123.json",import.meta.url),"utf8"));
 assert.equal(data.reviewRequired,true);
 assert.equal(data.publicationCount,0);
 assert.equal(data.images.length,1);
 const source=data.images[0];
 const filePage="https://commons.wikimedia.org/wiki/File:McCormick_X4.080%2C_Agritechnica_2023%2C_Hanover_%28P1140946%29.jpg";
 assert.equal(source.fileId,id);
 assert.equal(source.sourcePage,filePage);
 assert.equal(source.photographer,"MB-one");
 assert.equal(source.license,"CC BY-SA 4.0");
 assert.equal(source.approvedToPublish,false);
 assert.equal(source.originBytes,651874);
 assert.match(source.originSha256,/^[0-9a-f]{64}$/);
 assert.deepEqual(source.derivatives.map(item=>item.width),[480,960,1920]);
 // Earlier 480px and 720px JPEG/WebP assets are not replaced.
 for(const suffix of ["-480.jpg","-720.jpg","-720.webp"]){
   assert.ok(existsSync(new URL("../public/images/tractors/"+id+suffix,import.meta.url)),
     "Preserve existing low-res photo "+suffix);
 }
 for(const size of [960,1920]){
   const derivative=source.derivatives.find(d=>d.width===size);
   assert.ok(derivative);
   const filename=id+"-"+size+".jpg";
   assert.equal(derivative.file,filename);
   const bytes=readFileSync(new URL("../public/images/tractors/"+filename,import.meta.url));
   assert.equal(bytes.length,derivative.bytes);
   assert.equal(createHash("sha256").update(bytes).digest("hex"),derivative.sha256);
   assert.equal(bytes.readUInt16BE(0),0xffd8);
   assert.equal(bytes.readUInt16BE(bytes.length-2),0xffd9);
 }
 const exact=tractor("McCormick","X4.080");
 exact.tractor_id="d0c1306b-f178-4c6e-8c2f-945e645fee79";
 const photos=tractorPhotos(exact);
 assert.equal(photos.length,1,"Derivatives must not add duplicate gallery items");
 const photo=photos[0];
 assert.equal(photo.fileId,id);
 assert.equal(photo.photographer,"MB-one");
 assert.equal(photo.licenseName,"CC BY-SA 4.0");
 assert.equal(photo.sourcePage,filePage);
 assert.equal(photo.configurationExact,false);
 assert.ok(photo.displayUrl.endsWith(id+"-960.jpg"));
 assert.ok(photo.fullUrl.endsWith(id+"-1920.jpg"));
 for(const locale of LOCALES){
   const graph=modelStructuredData(exact,locale,"https://tractorvs.com/")["@graph"];
   const image=graph.find(node=>node["@type"]==="ImageObject");
   assert.ok(image,"No X4.080 ImageObject in locale "+locale);
   assert.ok(image.contentUrl.endsWith(photo.fullUrl));
   assert.ok(image.thumbnailUrl.endsWith(photo.displayUrl));
   assert.equal(image.creator.name,"MB-one");
   assert.equal(image.license,photo.licenseUrl);
   assert.equal(image.acquireLicensePage,filePage);
 }
 for(const other of ["X4.080 F Cab","X4.080 F Platform"]){
   assert.equal(tractorPhotos(tractor("McCormick",other)).length,0,
     "Do not spread the standard X4.080 photo to the orchard F trim");
 }
});


test("2026 McCormick X7.621 P6 Drive exact source and three SHA-verified JPEGs never match VT Drive",()=>{
 const fileId="mccormick-x7-621-barzkowice-zwiadowca21-2026";
 const proof=JSON.parse(readFileSync(new URL("../docs/photo-release-proof-mccormick-x7621-p6-20261123.json",import.meta.url),"utf8"));
 assert.equal(proof.approvedToPublish,true);
 assert.equal(proof.fileId,fileId);
 assert.equal(proof.visualEvidence.modelBadge,"X7.621");
 assert.equal(proof.visualEvidence.gearboxBadge,"P6 DRIVE");
 assert.equal(proof.visualEvidence.modelConfirmed,true);
 assert.equal(proof.visualEvidence.gearboxConfirmed,true);
 assert.equal(proof.visualEvidence.configurationExact,false);
 const p6=tractor("McCormick","X7.621 P6-Drive");
 p6.tractor_id="9c4cb31f-4fab-49ae-8ba1-3eee9f0059be";
 const photos=tractorPhotos(p6);
 assert.equal(photos.length,1,"Only this exact P6-Drive UUID is photographed");
 const photo=photos[0];
 assert.equal(photo.fileId,fileId);
 assert.equal(photo.tractorId,p6.tractor_id);
 assert.equal(photo.model,p6.model_name);
 assert.equal(photo.sourcePage,proof.sourcePage);
 assert.equal(photo.photographer,proof.sourceAuthor);
 assert.equal(photo.copyrightOwner,proof.sourceAuthor);
 assert.equal(photo.copyrightClaimUrl,proof.sourcePage);
 assert.equal(photo.copyrightEvidence,"commons-own-work-self-license");
 assert.equal(photo.licenseName,proof.license);
 assert.equal(photo.licenseUrl,proof.licenseUrl);
 assert.equal(photo.configurationExact,false);
 for(const [i,size] of [480,960,1920].entries()){
   const d=proof.derivedAssets[i];
   assert.equal(d.width,size);
   const filename=fileId+"-"+size+".jpg";
   const uri=new URL("../public/images/tractors/"+filename,import.meta.url);
   assert.ok(existsSync(uri),"Source-backed first-party photo missing: "+filename);
   const b=readFileSync(uri);
   assert.equal(b.length,d.bytes,filename);
   assert.equal(createHash("sha256").update(b).digest("hex"),d.sha256,filename);
   assert.equal(b.readUInt16BE(0),0xffd8);
   assert.equal(b.readUInt16BE(b.length-2),0xffd9);
   assert.ok([photo.thumbUrl,photo.displayUrl,photo.fullUrl].includes("/images/tractors/"+filename));
   const source=resolveApprovedPhotoSource("/images/tractors/"+filename);
   assert.ok(source?.startsWith("https://upload.wikimedia.org/wikipedia/commons/thumb/a/a8/"));
   assert.match(source,new RegExp("/"+(size===480?500:size)+"px-"));
 }
 for(const locale of LOCALES){
   const graph=modelStructuredData(p6,locale,"https://tractorvs.com/")["@graph"];
   const image=graph.find(x=>x["@type"]==="ImageObject");
   assert.ok(image,locale+" must expose correct source-backed ImageObject");
   assert.equal(image.creator.name,photo.photographer);
   assert.equal(image.copyrightNotice,photo.copyrightOwner);
   assert.equal(image.license,photo.licenseUrl);
   assert.equal(image.acquireLicensePage,photo.sourcePage);
   assert.ok(image.contentUrl.endsWith(photo.fullUrl));
   assert.ok(image.thumbnailUrl.endsWith(photo.displayUrl));
 }
 const nonP6=[
   ["X7.621 VT-Drive","085667ad-637c-481a-be71-847f439d7fa6"],
   ["X7.621 P6-Drive","00000000-0000-4000-8000-000000000000"],
   ["X7.623 P6-Drive","3470a6c5-7708-4f28-a797-1986c32b3439"]
 ];
 for(const [model,id] of nonP6){
   const other=tractor("McCormick",model);other.tractor_id=id;
   assert.equal(tractorPhotos(other).length,0,
     "P6-Drive photograph must not appear on another gearbox/model/UUID");
   assert.equal(primaryTractorPhoto(other),null,
     "Never leak the photographed P6-Drive into another model hero image");
   const graph=modelStructuredData(other,"tr","https://tractorvs.com/")["@graph"];
   assert.equal(graph.some(x=>x["@type"]==="ImageObject"),false);
 }
});


test("Landini 5-110 source-licensed RoboShift illustration opens only on exact EU record",()=>{
 const proof=JSON.parse(readFileSync(new URL("../docs/photo-release-proof-landini5110-20261123.json",import.meta.url),"utf8"));
 const staging=JSON.parse(readFileSync(new URL("../docs/photo-import-evidence-landini5110-20261123.json",import.meta.url),"utf8"));
 const id="landini-5-110-roboshift-marcelx42-2023";
 const exact="264687c1-8dd2-5801-9e2e-11901f4acf6b";
 assert.equal(proof.fileId,id);
 assert.equal(proof.approvedToPublish,true);
 assert.equal(proof.publishedRecord.tractor_id,exact);
 assert.equal(proof.publishedRecord.model_name,"5-110");
 assert.equal(proof.configurationExact,false);
 assert.equal(proof.photoTrim,"RoboShift");
 assert.equal(staging.fileId,id);
 assert.equal(staging.photographer,"MarcelX42");
 assert.equal(staging.licenseName,"CC BY-SA 4.0");
 assert.equal(staging.approvedToPublish,false,"Staging alone must never approve a photograph");
 assert.equal(proof.originalSourceSha256,staging.originalSourceSha256);
 const record=tractor("Landini","5-110");
 record.tractor_id=exact;
 record.variant="Serie 5 FPT Stage V; EU official brochure / equipment unspecified";
 record.market="Europe";
 const photos=tractorPhotos(record);
 assert.equal(photos.length,1);
 const p=photos[0];
 assert.equal(p.fileId,id);
 assert.equal(p.tractorId,exact);
 assert.equal(p.brand,"Landini");
 assert.equal(p.model,"5-110");
 assert.equal(p.configurationExact,false);
 assert.equal(p.photographer,"MarcelX42");
 assert.equal(p.copyrightOwner,"MarcelX42");
 assert.equal(p.copyrightEvidence,"commons-own-work-self-license");
 assert.equal(p.copyrightClaimUrl,p.sourcePage);
 assert.equal(p.sourcePage,staging.sourcePage);
 assert.equal(p.licenseName,"CC BY-SA 4.0");
 assert.equal(p.licenseUrl,"https://creativecommons.org/licenses/by-sa/4.0/");
 const all=[{...staging.existing480,file:id+"-480.jpg"},...staging.newDerivatives];
 assert.deepEqual(all.map(v=>v.width),[480,960,1920]);
 for(const asset of all){
  const uri=new URL("../public/images/tractors/"+asset.file,import.meta.url);
  assert.ok(existsSync(uri),"Missing first-party published JPEG "+asset.file);
  const bytes=readFileSync(uri);
  assert.equal(bytes.length,asset.bytes);
  assert.equal(createHash("sha256").update(bytes).digest("hex"),asset.sha256);
  assert.equal(bytes[0],255);assert.equal(bytes[1],216);assert.equal(bytes.at(-1),217);
  const url="/images/tractors/"+asset.file;
  assert.ok([p.thumbUrl,p.displayUrl,p.fullUrl].includes(url));
  assert.ok(resolveApprovedPhotoSource(url)?.includes("Landini_5-110_RoboShift"));
 }
 assert.ok(staging.existing480.meanPixelDifferenceFromSource1920.every(value=>value<20),
   "Original 480 must be physically the same photograph as newly imported 960/1920");
 for(const locale of LOCALES){
  const image=modelStructuredData(record,locale,"https://tractorvs.com/")["@graph"]
   .find(obj=>obj["@type"]==="ImageObject");
  assert.ok(image,"Source-licensed ImageObject for "+locale);
  assert.equal(image.creator?.name,p.photographer);
  assert.equal(image.copyrightNotice,p.copyrightOwner);
  assert.equal(image.acquireLicensePage,p.sourcePage);
  assert.equal(image.license,p.licenseUrl);
  assert.ok(image.contentUrl.endsWith(p.fullUrl));
  assert.ok(image.thumbnailUrl.endsWith(p.displayUrl));
  assert.ok(tractorPhotoAlt(record,locale).includes("Landini 5-110"));
  assert.ok(photoText(locale,"representative").length>10,
    "Show localized variant/trim disclaimer rather than claiming RoboShift universal");
 }
 for(const [wrongModel,wrongId] of [
  ["5-085","afbb2f1e-5fd9-5374-9532-5008a5d2fad6"],
  ["5-100","5a793f31-5597-5053-9aef-fd3ca259c588"],
  ["5-120","b2c71582-ef14-5234-9d75-0b6d39c9cf2e"],
  ["5-110","00000000-0000-4000-8000-000000000000"],
  ["5-110 RoboShift",exact]
 ]){
  const wrong=tractor("Landini",wrongModel);
  wrong.tractor_id=wrongId;
  assert.equal(tractorPhotos(wrong).length,0,
    "Never transfer image to adjacent model/unauthorized UUID: "+wrongModel+" "+wrongId);
  assert.equal(primaryTractorPhoto(wrong),null);
 }
});


test("two already licensed photos have verified first-party 960 and 1920 JPEG sizes",()=>{
 const proof=JSON.parse(readFileSync(new URL("../docs/photo-960-1920-repair-evidence-20261123.json",import.meta.url),"utf8"));
 assert.equal(proof.reviewRequired,true);
 assert.equal(proof.approvedToPublish,false);
 assert.equal(proof.publicationCount,0);
 assert.equal(proof.images.length,2);
 const expected=new Map([
  ["valtra-t255-622d182c",{brand:"Valtra",model:"T255",author:"Bene Riobó"}],
  ["versatile-nemesis-255-be32337e",{brand:"Versatile",model:"Nemesis 255",author:"MarcelX42"}]
 ]);
 assert.deepEqual(new Set(proof.images.map(p=>p.fileId)),new Set(expected.keys()));
 for(const entry of proof.images){
  const identity=expected.get(entry.fileId);
  assert.ok(identity);
  assert.equal(entry.brand,identity.brand);
  assert.equal(entry.model,identity.model);
  assert.equal(entry.author,identity.author);
  assert.equal(entry.license,"CC BY-SA 4.0");
  assert.equal(entry.sourceRoute,"https://tractorvs.com/images/tractors/"+entry.fileId+"-1920.jpg");
  assert.ok(entry.meanRgbDifferenceAgainstExisting480.every(x=>x<20));
  const photo=APPROVED_TRACTOR_PHOTOS.find(p=>p.fileId===entry.fileId);
  assert.ok(photo,"Previously approved photograph must still exist");
  assert.equal(photo.brand,identity.brand);
  assert.equal(photo.model,identity.model);
  assert.equal(photo.photographer,identity.author);
  assert.equal(decodeURIComponent(photo.sourcePage),decodeURIComponent(entry.sourcePage),
    "Equivalent percent-encoded Commons File URLs must identify the same actual image");
  assert.equal(photo.licenseName,"CC BY-SA 4.0");
  const old=entry.existing480;
  const oldBytes=readFileSync(new URL("../public/images/tractors/"+old.file,import.meta.url));
  assert.equal(createHash("sha256").update(oldBytes).digest("hex"),old.sha256);
  assert.deepEqual(entry.newFiles.map(v=>v.width),[960,1920]);
  for(const asset of entry.newFiles){
   const bytes=readFileSync(new URL("../public/images/tractors/"+asset.file,import.meta.url));
   assert.equal(bytes.length,asset.bytes);
   assert.equal(createHash("sha256").update(bytes).digest("hex"),asset.sha256);
   assert.equal(bytes.subarray(0,3).toString("hex"),"ffd8ff");
   assert.equal(bytes.subarray(-2).toString("hex"),"ffd9");
   assert.ok([photo.displayUrl,photo.fullUrl].includes("/images/tractors/"+asset.file));
  }
 }
});

test("Visible model badges and static JPEGs belong only to the reviewed record",()=>{
  const evidence=JSON.parse(readFileSync(new URL("../docs/photo-evidence-exact-badges-20261124.json",import.meta.url)));
  for(const item of evidence){
    const record={...tractor(item.brand,item.model),tractor_id:item.tractorId};
    const photo=tractorPhotos(record).find(p=>p.fileId===item.fileId);
    assert.ok(photo);
    assert.equal(photo.licenseUrl,item.licenseUrl);
    assert.equal(photo.photographer,item.photographer);
    assert.equal(photo.configurationExact,false);
    const siblings={Belarus:["920.2","920.3","920.5"],Kioti:["HX1302ATC-EU","HX1403"],Swaraj:[item.model+" 4WD",item.model+" Protek"]}[item.brand];
    for(const model of siblings)
      assert.ok(!tractorPhotos({...record,model_name:model}).some(p=>p.fileId===photo.fileId));
    for(const derivative of item.derivatives){
      const bytes=readFileSync(new URL("../public/images/tractors/"+derivative.file,import.meta.url));
      assert.equal(createHash("sha256").update(bytes).digest("hex"),derivative.sha256);
    }
  }
});


test("Zetor Major CL80 verified photo belongs only to the reviewed Europe UUID",()=>{
 const [e]=JSON.parse(readFileSync(new URL("../docs/photo-evidence-zetor-major-cl80-20261124.json",import.meta.url),"utf8"));
 const exact={...tractor("Zetor","MAJOR"),tractor_id:"755e44bc-8043-4d41-9e08-f40e818ac00b",variant:"CL 80 · Europe",market:"Europe"};
 const p=tractorPhotos(exact).find(photo=>photo.fileId==="zetor-major-cl80-jj7777");
 assert.ok(p);assert.equal(p.tractorId,exact.tractor_id);assert.equal(p.photographer,"JJ7777");assert.equal(p.licenseName,"CC BY-SA 4.0");assert.equal(p.sourcePage,e.sourcePage);assert.equal(p.configurationExact,false);
 for(const wrong of [{...exact,tractor_id:"00000000-0000-4000-8000-000000000000"},{...exact,model_name:"MAJOR HS 80"},{...exact,brand_name:"Other"}])assert.ok(!tractorPhotos(wrong).some(x=>x.fileId===p.fileId));
 assert.deepEqual(e.derivatives.map(x=>x.width),[480,960,1920]);
 for(const d of e.derivatives){const b=readFileSync(new URL("../public/images/tractors/"+d.file,import.meta.url));assert.equal(b.length,d.bytes);assert.equal(createHash("sha256").update(b).digest("hex"),d.sha256);assert.equal(b.subarray(0,3).toString("hex"),"ffd8ff");assert.equal(b.subarray(-2).toString("hex"),"ffd9");assert.ok(resolveApprovedPhotoSource("/images/tractors/"+d.file)?.includes("ZETOR_MAJOR.jpg"));}
 for(const locale of LOCALES){const image=modelStructuredData(exact,locale,"https://tractorvs.com/")["@graph"].find(x=>x["@type"]==="ImageObject");assert.ok(image,locale);assert.equal(image.creator?.name,p.photographer);assert.equal(image.license,p.licenseUrl);assert.equal(image.acquireLicensePage,p.sourcePage);assert.ok(image.contentUrl.endsWith(p.fullUrl));assert.ok(tractorPhotoAlt(exact,locale).includes("Zetor MAJOR"));assert.ok(photoText(locale,"representative").length>10);}
});
