import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {createHash} from "node:crypto";
import {LOCALES} from "../src/lib/locales.ts";
import {APPROVED_TRACTOR_PHOTOS,tractorPhotos} from "../src/lib/tractor-photos.ts";
import {modelStructuredData} from "../src/lib/model-seo.ts";
const T25="622ddce0-f3a8-48ad-8ec6-45ca936dba6f";
const T115="80fd42a2-3059-40bb-a0e1-511ae6100213";
const F50CHN="458be7b8-f6b8-4319-b264-dc6c7cc36ae7";
const model=(name,id)=>({
  tractor_id:id,slug:"verified-tym",brand_name:"TYM",model_name:name,
  brand_country:null,brand_website_url:null,market:"International",
  variant:null,model_year:null,horsepower:null,engine:null,
  transmission:null,drivetrain:null,weight_kg:null,specifications:[]
});
const ledger=(name)=>JSON.parse(readFileSync(new URL("../docs/"+name,import.meta.url),"utf8"));
test("five first-party licensed JPEG sources are unique, binary integrity verified and scoped to the correct UUIDs",()=>{
  const proof=[...ledger("photo-import-evidence-tym-f50chn-wave3-20261122.json").images,
    ...ledger("photo-import-evidence-tym-t25-t115-four-20261122.json").images
      .filter(x=>x.fileId.endsWith("-rear-marcelx42-2025"))];
  assert.equal(proof.length,5);
  const approved=new Map(APPROVED_TRACTOR_PHOTOS.map(x=>[x.fileId,x]));
  for(const src of proof){
    const photo=approved.get(src.fileId);
    assert.ok(photo,"Approved photo missing: "+src.fileId);
    const expectedUUID=src.fileId.includes("t3048")?F50CHN:
      src.fileId.includes("t2025p")?T25:T115;
    assert.equal(photo.tractorId,expectedUUID);
    assert.equal(photo.photographer,"MarcelX42");
    assert.equal(photo.licenseName,"CC BY-SA 4.0");
    assert.equal(photo.licenseUrl,"https://creativecommons.org/licenses/by-sa/4.0/");
    assert.equal(photo.configurationExact,false);
    assert.equal(decodeURIComponent(src.sourcePage),decodeURIComponent(photo.sourcePage));
    assert.equal(src.derivatives.length,3);
    for(const derivative of src.derivatives){
      const bytes=readFileSync(new URL("../public/images/tractors/"+derivative.file,import.meta.url));
      assert.equal(bytes.length,derivative.bytes);
      assert.equal(bytes.subarray(0,2).toString("hex"),"ffd8");
      assert.equal(bytes.subarray(-2).toString("hex"),"ffd9");
      assert.equal(createHash("sha256").update(bytes).digest("hex"),derivative.sha256);
    }
  }
});
test("F50CHN has three new views and cannot leak to adjacent T3048 variants in ten locales",()=>{
  const record=model("T3048",F50CHN);
  const pictures=tractorPhotos(record);
  assert.equal(pictures.length,3);
  assert.deepEqual(pictures.map(x=>x.fileId),[
    "tym-t3048-f50chn-55-marcelx42-2025",
    "tym-t3048-f50chn-57-marcelx42-2025",
    "tym-t3048-f50chn-73-marcelx42-2025"
  ]);
  for(const locale of LOCALES){
    const nodes=modelStructuredData(record,locale,"https://tractorvs.com/")["@graph"];
    const primary=nodes.find(x=>x["@type"]==="ImageObject");
    assert.ok(primary,locale);
    assert.equal(primary.creator.name,"MarcelX42");
    assert.equal(primary.license,pictures[0].licenseUrl);
  }
  for(const id of [
    "e5dd1074-88ae-4293-8748-19c57de60088",
    "5d1360a7-1494-44b9-9728-93de291ab082",
    "12d51778-7e30-46ac-9428-ce672a4bf4a0",
    undefined
  ])assert.equal(tractorPhotos(model("T3048",id)).length,0);
});
test("international T25 and T115 reuse existing front photo and have one new, unique rear angle",()=>{
  for(const [name,id,front,rear] of [
    ["T2025P",T25,"tym-t2025p-t25-marcelx42-2025","tym-t2025p-t25-rear-marcelx42-2025"],
    ["T6115",T115,"tym-t6115-t115-marcelx42-2025","tym-t6115-t115-rear-marcelx42-2025"]
  ]){
    const gallery=tractorPhotos(model(name,id));
    assert.deepEqual(gallery.map(x=>x.fileId),[front,rear]);
    assert.equal(gallery[1].tractorId,id);
    assert.equal(gallery[1].photographer,"MarcelX42");
    assert.equal(tractorPhotos(model(name,"00000000-0000-4000-8000-000000000000")).length,1,
      "Legacy front may remain model-level; rear view must remain exact UUID only");
    for(const locale of LOCALES){
      const image=modelStructuredData(model(name,id),locale,"https://tractorvs.com/")["@graph"]
        .find(x=>x["@type"]==="ImageObject");
      assert.ok(image,locale);
      assert.equal(image.license,"https://creativecommons.org/licenses/by-sa/4.0/");
    }
  }
});
