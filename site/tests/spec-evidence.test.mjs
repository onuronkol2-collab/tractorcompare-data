import test from "node:test";
import assert from "node:assert/strict";
import {
  specificationEvidenceLevel,
  specificationEvidenceLabel,
  officialManufacturerSourceUrl,
} from "../src/lib/catalog.ts";

const official = {
  source_url: "https://www.newholland.com.tr/traktorler/t5-bluemaster-masterdrive-faz5",
  source_type: "manufacturer_specification",
  evidence_text: "Rated engine power 110 hp",
  verified_at: "2026-11-15T12:00:00Z",
};

test("official documented specification has cautious manufacturer-document label", () => {
  const level = specificationEvidenceLevel(official);
  assert.equal(level, "manufacturer_documented");
  assert.equal(specificationEvidenceLabel(level, "tr"), "Üretici belgesine dayalı");
  assert.equal(specificationEvidenceLabel(level, "en"), "Manufacturer document sourced");
});

test("third-party source is not mislabeled as manufacturer confirmed", () => {
  const level = specificationEvidenceLevel({
    ...official,
    source_type: "independent_test",
    source_url: "https://example.org/review/tractor-model",
  });
  assert.equal(level, "third_party_reported");
  assert.match(specificationEvidenceLabel(level, "tr"), /üretici teyidi yok/);
});

test("missing source, missing evidence, or missing check yields unverified", () => {
  for (const spec of [
    { ...official, source_url: null },
    { ...official, evidence_text: "" },
    { ...official, evidence_text: "  " },
    { ...official, verified_at: null },
    { ...official, verified_at: "not a timestamp" },
    { ...official, source_url: "javascript:alert(1)" },
  ]) {
    assert.equal(specificationEvidenceLevel(spec), "not_verified");
  }
  assert.match(specificationEvidenceLabel("not_verified", "tr"), /doğrulanmadı/);
});

test("official link alone is not treated as verified evidence", () => {
  assert.equal(specificationEvidenceLevel({
    ...official,
    source_type: "official_product_page",
    verified_at: null,
  }), "not_verified");
});

test("classification is read-only and does not change publication metadata", () => {
  const record = Object.freeze({ ...official, status: "draft" });
  assert.equal(specificationEvidenceLevel(record), "manufacturer_documented");
  assert.equal(record.status, "draft");
});

test("only documented manufacturer URL on approved original domain is public", () => {
  assert.equal(officialManufacturerSourceUrl(official, "New Holland"),
    official.source_url);
  assert.equal(officialManufacturerSourceUrl({
    ...official,
    source_url: "https://admin.basaktraktor.com.tr/upload/spec.pdf",
  }, "Başak Traktör"), "https://admin.basaktraktor.com.tr/upload/spec.pdf");
  assert.equal(officialManufacturerSourceUrl({
    ...official,
    source_url: "https://basaktraktor.com.tr/tractors/2075",
  }, "Başak Traktör"), "https://basaktraktor.com.tr/tractors/2075");
});

test("third-party publications never produce visible links even with evidence", () => {
  for (const source_type of ["independent_test", "technical_report", "review"]) {
    assert.equal(officialManufacturerSourceUrl({
      ...official, source_type, source_url:"https://tractordata.com/tractors/view",
    }, "New Holland"), null);
  }
});

test("source type cannot spoof official origin and manufacturer host is checked", () => {
  for (const source_url of [
    "https://tractordata.com/tractor-123",
    "https://newholland.com.tr.evil.example/tractor",
    "https://newholland.com.tr@evil.example/tractor",
    "javascript:alert(1)",
    "http://newholland.com.tr/tractor",
  ]) {
    assert.equal(officialManufacturerSourceUrl({
      ...official, source_url,
    }, "New Holland"), null, source_url);
  }
  assert.equal(officialManufacturerSourceUrl(official,"Unreviewed Brand"),null);
});

test("missing evidence never exposes manufacturer URL", () => {
  assert.equal(officialManufacturerSourceUrl({...official, evidence_text:null},"New Holland"),null);
  assert.equal(officialManufacturerSourceUrl({...official, verified_at:null},"New Holland"),null);
});

test("2021 original Massey Ferguson brochure gets a link when evidence is checked", () => {
  const mfSource = "https://www.masseyferguson.com/content/dam/public/masseyfergusonglobal/markets/en_za/assets/productbrochures/tractors/mf-4700/17346_MF%204700-Brochure_South_Africa-2021.pdf";
  assert.equal(officialManufacturerSourceUrl({
    ...official, source_url: mfSource,
  }, "Massey Ferguson"), mfSource);
});

test("LS Tractor manufacturer URL is visible with linked evidence", () => {
  const lsUrl = "https://www.lstractor.com/en/product/tractor/tractor_J";
  assert.equal(officialManufacturerSourceUrl({
    ...official, source_url:lsUrl, source_type:"official_product_page",
  }, "LS Tractor"), lsUrl);
});

test("only the reviewed exact TYM F36 PDF is allowed from shared media host", () => {
  const tymUrl = "https://tym-new.euwest01.umbraco.io/media/b01j3nc1/f36-produktbroschu-re.pdf";
  assert.equal(officialManufacturerSourceUrl({
    ...official, source_url:tymUrl,
  }, "TYM"), tymUrl);
  assert.equal(officialManufacturerSourceUrl({
    ...official, source_url:"https://tym-new.euwest01.umbraco.io/media/other/upload.pdf",
  }, "TYM"), null);
});

test("exact LS Tractor USA official model pages are linked when evidence is verified",()=>{
  for(const model of ["mt122","mt125","mt573c","mt573cps"]){
    const url="https://lstractorusa.com/tractor/"+model+"/";
    assert.equal(officialManufacturerSourceUrl({
      ...official,source_url:url
    },"LS Tractor"),url);
  }
  for(const source_url of [
    "http://lstractorusa.com/tractor/mt122/",
    "https://lstractorusa.com.evil.example/tractor/mt122/",
    "https://lstractorusa.com@evil.example/tractor/mt122/"
  ])assert.equal(officialManufacturerSourceUrl({...official,source_url},"LS Tractor"),null);
});

test("official Zetor UK Forterra manufacturer table is linkable only with dated model-verified evidence",()=>{
  const spec={
    ...official,
    source_url:"https://www.zetor.co.uk/zetor-forterra-technical-parameters",
    source_type:"manufacturer_specification",
    evidence_text:"Zetor Forterra CL 140 Stage V, ECE R120 power: 136.2 HP; verified from official UK model column.",
    verified_at:"2026-11-19T20:00:00Z",
  };
  assert.equal(officialManufacturerSourceUrl(spec,"Zetor"),spec.source_url);
  for(const source_url of [
    "http://www.zetor.co.uk/zetor-forterra-technical-parameters",
    "https://zetor.co.uk.evil.example/specification",
    "https://zetor.co.uk@evil.example/specification",
    "https://www.zetor.co.uk.evil.example/specification",
    "https://www.unverified-zetor-brochures.example/test",
  ])assert.equal(officialManufacturerSourceUrl({...spec,source_url},"Zetor"),null);
  assert.equal(officialManufacturerSourceUrl({...spec,verified_at:null},"Zetor"),null);
  assert.equal(officialManufacturerSourceUrl({...spec,source_type:"independent_test"},"Zetor"),null);
});


test("Tümosan 8095 exact manufacturer page appears only with dated source evidence", () => {
  const src = {
    ...official,
    source_url: "https://www.tumosan.com.tr/tr/urunler/8095",
    source_type: "manufacturer_specification",
    evidence_text: "Tümosan 8095 resmî ürün tablosu: Nominal Motor Gücü (HP) = 95",
  };
  assert.equal(officialManufacturerSourceUrl(src, "Tümosan"), src.source_url);
  for (const source_url of [
    "http://www.tumosan.com.tr/tr/urunler/8095",
    "https://www.tumosan.com.tr.evil.test/tr/urunler/8095",
    "https://www.tumosan.com.tr@evil.test/tr/urunler/8095",
  ]) assert.equal(officialManufacturerSourceUrl({...src, source_url}, "Tümosan"), null);
  assert.equal(officialManufacturerSourceUrl({...src, verified_at:null}, "Tümosan"), null);
});

test("CNH shared content hub is allowlisted ONLY for the actual model-verified TD5 brochure", () => {
  const url = "https://cnhi-p-001-delivery.sitecorecontenthub.cloud/api/public/content/c3d13220f29640458ef3f059d2865523?v=25dae628";
  const src = {
    ...official,
    source_url: url,
    source_type: "manufacturer_specification",
    evidence_text: "New Holland TD5.90: Rated horsepower ISO TR14396 ECE R120 = 66/88 kW/hp",
  };
  assert.equal(officialManufacturerSourceUrl(src, "New Holland"), url);
  for (const source_url of [
    "https://cnhi-p-001-delivery.sitecorecontenthub.cloud/api/public/content/anotherfile?v=25dae628",
    "https://cnhi-p-001-delivery.sitecorecontenthub.cloud/api/public/content/c3d13220f29640458ef3f059d2865523?v=malicious",
    "https://cnhi-p-001-delivery.sitecorecontenthub.cloud.bad.test/api/public/content/c3d13220f29640458ef3f059d2865523?v=25dae628",
    "http://cnhi-p-001-delivery.sitecorecontenthub.cloud/api/public/content/c3d13220f29640458ef3f059d2865523?v=25dae628",
  ]) assert.equal(officialManufacturerSourceUrl({...src, source_url}, "New Holland"), null, source_url);
  assert.equal(officialManufacturerSourceUrl({...src, source_type:"independent_test"}, "New Holland"), null);
  assert.equal(officialManufacturerSourceUrl({...src, evidence_text:""}, "New Holland"), null);
  assert.equal(officialManufacturerSourceUrl(src, "Case IH"), null);
});

test("Yanmar official product specification is linkable only from verified original manufacturer URL",()=>{
  const specimen={...official,
    source_type:"official_product_specification",
    source_url:"https://www.yanmar.com/tr/agri/products/tractor/sa222r/",
    evidence_text:"Yanmar SA222,R model-specific specifications: Engine horsepower 22 HP",
  };
  assert.equal(specificationEvidenceLevel(specimen),"manufacturer_documented");
  assert.equal(officialManufacturerSourceUrl(specimen,"Yanmar"),specimen.source_url);
  for(const url of [
    "https://www.yanmar.com.evil.example/tr/agri/products/tractor/sa222r/",
    "https://www.yanmar.com@evil.example/tr/agri/products/tractor/sa222r/",
    "http://www.yanmar.com/tr/agri/products/tractor/sa222r/",
  ]) assert.equal(officialManufacturerSourceUrl({...specimen,source_url:url},"Yanmar"),null);
  assert.equal(officialManufacturerSourceUrl({...specimen,verified_at:null},"Yanmar"),null);
});

test("Fendt verified official technical-data source type passes original-domain gate",()=>{
  const specimen={...official,source_type:"official_technical_data",
    source_url:"https://api.fendt.com/techdata/GB/en/1551551",
    evidence_text:"724 Vario | Rated power 179 kW / 243 hp"};
  assert.equal(officialManufacturerSourceUrl(specimen,"Fendt"),specimen.source_url);
  assert.equal(officialManufacturerSourceUrl({...specimen,source_url:"https://api.fendt.com.evil.example/techdata/GB/en/1551551"},"Fendt"),null);
});


test("maker-source links are visible for dated Agrale, ArmaTrac and Sonalika evidence only",()=>{
  const sources=[
    ["Agrale","https://www.agrale.com.br/en/detalhes/tratores/tratores-agricolas/trator-525"],
    ["ArmaTrac","https://armatrac.com/tractor/286/804-fruit-garden-cabin"],
    ["ArmaTrac","https://armatrac.com/tractor/288/8044-fruit-garden-rops"],
    ["Sonalika","https://www.sonalika.com/tractor/DI-734-Power-Plus"],
    ["Sonalika","https://international.sonalika.com/tractors/"],
  ];
  for(const [brand,url] of sources){
    const proof={...official,source_url:url,source_type:"official_product_page",
      evidence_text:"Original producer-specific model technical specifications independently checked",
      verified_at:"2026-11-21T06:00:00Z"};
    assert.equal(specificationEvidenceLevel(proof),"manufacturer_documented",brand);
    assert.equal(officialManufacturerSourceUrl(proof,brand),url,"real maker link hidden "+brand);
    assert.equal(officialManufacturerSourceUrl({...proof,verified_at:null},brand),null,"no source date");
    assert.equal(officialManufacturerSourceUrl({...proof,evidence_text:""},brand),null,"no manufacturer evidence");
    assert.equal(officialManufacturerSourceUrl({...proof,source_type:"independent_test"},brand),null,"independent source cannot masquerade as maker");
    for(const bad of [
      url.replace("https://","http://"),
      url.replace("https://","https://attacker@"),
      url.replace("https://","https://").replace(/^(https:\/\/[^/]+)/,"$1.evil.test"),
    ])assert.equal(officialManufacturerSourceUrl({...proof,source_url:bad},brand),null,"host/HTTPS spoof "+bad);
  }
  // Same real manufacturer host must never be accepted under another brand.
  assert.equal(officialManufacturerSourceUrl({...official,source_url:sources[0][1]},"ArmaTrac"),null);
  assert.equal(officialManufacturerSourceUrl({...official,source_url:sources[1][1]},"Sonalika"),null);
  assert.equal(officialManufacturerSourceUrl({...official,source_url:sources[3][1]},"Agrale"),null);
  assert.equal(officialManufacturerSourceUrl({...official,source_url:"https://sonalika.com.evil.example/tractor/DI-734-Power-Plus"},"Sonalika"),null);
});
