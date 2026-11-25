import test from "node:test";
import assert from "node:assert/strict";
import {
  specLabel,
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

test("producer-owned Agrale, ArmaTrac and Sonalika sources restore citations without relaxing evidence gates",()=>{
  const entries=[
    ["Agrale","https://www.agrale.com.br/en/detalhes/tratores/tratores-agricolas/trator-525"],
    ["ArmaTrac","https://armatrac.com/tractor/286/804-fruit-garden-cabin"],
    ["Sonalika","https://www.sonalika.com/tractor/DI-734-Power-Plus"],
    ["Sonalika","https://international.sonalika.com/tractors/"],
  ];
  for(const [brand,url] of entries){
    const row={...official,source_url:url,source_type:"official_product_page",
      evidence_text:"Source document contains the matching manufacturer model specification",
      verified_at:"2026-11-21T06:00:00Z"};
    assert.equal(officialManufacturerSourceUrl(row,brand),url);
    for(const invalid of [
      {...row,source_url:url.replace("https://","http://")},
      {...row,source_url:url.replace(/^(https:\/\/[^/]+)/,"$1.evil.example")},
      {...row,verified_at:null},
      {...row,evidence_text:""},
      {...row,source_type:"independent_test"},
    ]) assert.equal(officialManufacturerSourceUrl(invalid,brand),null,brand);
  }
  assert.equal(officialManufacturerSourceUrl({...official,source_url:entries[0][1]},"ArmaTrac"),null);
  assert.equal(officialManufacturerSourceUrl({...official,source_url:entries[1][1]},"Sonalika"),null);
});

test("ISEKI UK subsidiary PDF is approved only at its exact reviewed document URL",()=>{
  const exact="https://www.iseki.co.uk/wp-content/uploads/2021/02/Iseki-TXGS24-Range-WEB-2.pdf";
  const sample={...official,source_url:exact,source_type:"manufacturer_specification",
    evidence_text:"ISEKI TXGS24 manufacturer-authored range table with exact model identity",
    verified_at:"2026-11-21T06:00:00Z"};
  assert.equal(officialManufacturerSourceUrl(sample,"Iseki"),exact);
  for(const bad of [
    exact.replace("https://","http://"),
    exact.replace("Iseki-TXGS24-Range-WEB-2.pdf","other-tractor.pdf"),
    exact.replace("www.iseki.co.uk","www.iseki.co.uk.evil.example"),
  ]) assert.equal(officialManufacturerSourceUrl({...sample,source_url:bad},"Iseki"),null);
  assert.equal(officialManufacturerSourceUrl({...sample,evidence_text:null},"Iseki"),null);
  assert.equal(officialManufacturerSourceUrl({...sample,source_type:"independent_test"},"Iseki"),null);
});

test("reviewed McCormick and STEYR technical tables remain document- and brand-specific",()=>{
  const documents = [
    ["McCormick", "https://www.mccormick.it/wp-content/uploads/2025/02/MC_TractorRange2025_Brochure_88p_6737432A2_Web_IT.pdf"],
    ["McCormick", "https://www.mccormick.it/wp-content/uploads/2025/02/MC_TractorRange2025_Brochure_88p_6737433A2_Web_EN.pdf"],
    ["McCormick", "https://www.mccormick.it/wp-content/uploads/2025/03/MC_RP5D-RP5E_X4F_Brochure_44p_6732663A2_web_EN.pdf"],
    ["Steyr", "https://cnhi-p-001-delivery.sitecorecontenthub.cloud/api/public/content/73a2d291ba294a3489494574db262ed8?v=a0856698"],
    ["Steyr", "https://cnhi-p-001-delivery.sitecorecontenthub.cloud/api/public/content/f4491a850bdb4fdba24a4c5a2baa11fb?v=362a03d2"],
  ];
  for (const [brand,url] of documents) {
    const row={...official,source_url:url};
    assert.equal(officialManufacturerSourceUrl(row,brand),url);
    assert.equal(officialManufacturerSourceUrl(row,"Unrelated brand"),null);
    assert.equal(officialManufacturerSourceUrl({...row,verified_at:null},brand),null);
    assert.equal(officialManufacturerSourceUrl({...row,evidence_text:""},brand),null);
    assert.equal(officialManufacturerSourceUrl({...row,source_url:url+"&other=1"},brand),null);
  }
});


test("reviewed Iseki, JCB, Lindner and Erkunt exact documents restore source citations without widening host trust", () => {
  const documents = [
  [
    "Iseki",
    "https://www.iseki.co.jp/global/cms/upload/pdf/products/tractor/TG6%20Specification.pdf",
    "official_technical_pdf"
  ],
  [
    "JCB",
    "https://www.jcb.com/en-GB/products/machines/agricultural-tractors/6000-series/",
    "official_product_specification"
  ],
  [
    "JCB",
    "https://www.jcb.com/en-GB/explore/insight/news/2025/11/jcb-launches-all-new-high-tech-fastrac-6000-series-tractors/",
    "official_product_page"
  ],
  [
    "Lindner",
    "https://www.lindner-traktoren.at/en/tractors-transporters/lintrac/lintrac-75-ls",
    "official_product_page"
  ],
  [
    "Lindner",
    "https://www.lindner-traktoren.at/en/tractors-transporters/lintrac/lintrac-95-ls",
    "official_product_page"
  ],
  [
    "Lindner",
    "https://www.lindner-traktoren.at/en/tractors-transporters/lintrac/lintrac-115-ls",
    "official_product_page"
  ],
  [
    "Lindner",
    "https://www.lindner-traktoren.at/en/tractors-transporters/tractors/lintrac-160",
    "official_product_page"
  ],
  [
    "Erkunt",
    "https://erkunttraktor.com.tr/assets/model_dosyalar/pdfs/LuksCRD5Brosur.pdf?t=20260304140933",
    "official_technical_pdf"
  ]
];
  for (const [brand, url, source_type] of documents) {
    const row = {...official, source_url:url, source_type};
    assert.equal(officialManufacturerSourceUrl(row,brand),url);
    assert.equal(officialManufacturerSourceUrl(row,"Unrelated Brand"),null);
    for (const bad of [
      {...row, source_url:url.replace("https://","http://")},
      {...row, source_url:url.replace(/^(https:\/\/[^/]+)/,"$1:8443")},
      {...row, source_url:url.replace(/^(https:\/\/[^/]+)/,"$1.evil.example")},
      {...row, source_url:url+(url.includes("?")?"&":"?")+"unexpected=1"},
      {...row, source_url:new URL("/unreviewed-document.pdf",url).href},
      {...row, evidence_text:""},
      {...row, verified_at:null},
      {...row, source_type:"independent_test"},
    ]) assert.equal(officialManufacturerSourceUrl(bad,brand),null,brand);
  }
  assert.equal(officialManufacturerSourceUrl({...official,source_url:"https://www.newholland.com.tr:8443/tractors/model"},"New Holland"),null);
});

// Actual rendered source labels from the 469-model, 10-locale preview audit.
// Check the exact known fallback variants without rewriting data or standards.
const auditedHeadings20261125 = [
  [
    "en",
    "Arka AğıRlıK TakıMı",
    "Rear ballast set"
  ],
  [
    "en",
    "Azami Motor GüCü",
    "Maximum engine power"
  ],
  [
    "en",
    "Azami Motor GüCü (KW)",
    "Maximum engine power (kW)"
  ],
  [
    "en",
    "DöRt çEker Kumandası",
    "4WD control"
  ],
  [
    "en",
    "ÖN AğıRlıK TakıMı",
    "Front ballast set"
  ],
  [
    "en",
    "ÖN Diferansiyel Kilidi",
    "Front differential lock"
  ],
  [
    "en",
    "ÖN Iz GenişLiğI",
    "Front track width"
  ],
  [
    "en",
    "Akü Devre Kesici",
    "Battery disconnect switch"
  ],
  [
    "en",
    "Arka Diferansiyel Kumandası",
    "Rear differential control"
  ],
  [
    "en",
    "Ayak Freni Kontrolü",
    "Foot brake control"
  ],
  [
    "en",
    "Ayak Freni Kumandası",
    "Foot brake control"
  ],
  [
    "en",
    "Azami Güç Motor Devri",
    "Engine speed at maximum power"
  ],
  [
    "en",
    "Azami Hidrolik Pompa BasıNcı",
    "Maximum hydraulic pump pressure"
  ],
  [
    "en",
    "Azami Motor GüCü (ISO 14396, Hp)",
    "Maximum engine power (ISO 14396, hp)"
  ],
  [
    "en",
    "Azami Motor GüCü (ISO 14396, KW)",
    "Maximum engine power (ISO 14396, kW)"
  ],
  [
    "en",
    "DöRt çEker Kontrolü",
    "4WD control"
  ],
  [
    "en",
    "DöRt Tekerden Frenleme",
    "Four-wheel braking"
  ],
  [
    "en",
    "Ek AğıRlıKsıZ TraktöR AğıRlığı",
    "Tractor weight without additional ballast"
  ],
  [
    "en",
    "Güç DeğErindeki Motor Devri",
    "Engine speed at stated power"
  ],
  [
    "en",
    "Hidrolik çıKış",
    "Hydraulic outlet"
  ],
  [
    "en",
    "Hidrolik çıKış / Valf",
    "Hydraulic outlet / valve"
  ],
  [
    "en",
    "HıZ Aralığı",
    "Speed range"
  ],
  [
    "en",
    "İLeri / Geri Vites SeçEnekleri",
    "Forward / reverse gear options"
  ],
  [
    "en",
    "Nominal Motor GüCü",
    "Rated engine power"
  ],
  [
    "en",
    "Nominal Motor GüCüNdeki Devir",
    "Engine speed at rated power"
  ],
  [
    "en",
    "ÖN / Arka Lastik öLçüSü",
    "Front / rear tyre size"
  ],
  [
    "en",
    "ÖN / Arka Lastik Opsiyonları",
    "Front / rear tyre options"
  ],
  [
    "en",
    "ÖN AğıRlıK",
    "Front ballast"
  ],
  [
    "en",
    "ÖN Hidrolik Güç çıKışı (Opsiyon)",
    "Optional front hydraulic power outlet"
  ],
  [
    "en",
    "ÖN PTO Devri (Opsiyon)",
    "Optional front PTO speed"
  ],
  [
    "en",
    "ÖN üç Nokta Askı Kapasitesi (Opsiyon)",
    "Optional front three-point hitch capacity"
  ],
  [
    "en",
    "ÖN/Arka Lastik SeçEnekleri",
    "Front / rear tyre options"
  ],
  [
    "en",
    "OperatöR Istasyonu",
    "Operator station"
  ],
  [
    "en",
    "Park Freni Kontrolü",
    "Parking brake control"
  ],
  [
    "en",
    "Park Freni Kumandası",
    "Parking brake control"
  ],
  [
    "en",
    "PTO Debriyajı",
    "PTO clutch"
  ],
  [
    "en",
    "PTO IçIn Gereken Motor Devri",
    "Engine speed required for PTO"
  ],
  [
    "en",
    "ŞAnzıMan Debriyajı",
    "Transmission clutch"
  ],
  [
    "en",
    "Toplam Uzunluk (öN AğıRlıKlarla)",
    "Overall length with front ballast"
  ],
  [
    "tr",
    "Forward/Reverse Ranges Or Gears",
    "İleri/geri kademe veya vitesler"
  ],
  [
    "tr",
    "Differential Lock Control",
    "Diferansiyel kilidi kumandası"
  ],
  [
    "tr",
    "Hydraulic Oil Circuit",
    "Hidrolik yağ devresi"
  ],
  [
    "tr",
    "Maximum Front Axle Load",
    "Azami ön aks yükü"
  ],
  [
    "tr",
    "Maximum Rear Axle Load",
    "Azami arka aks yükü"
  ],
  [
    "tr",
    "Permissible Total Weight",
    "İzin verilen toplam ağırlık"
  ],
  [
    "tr",
    "Standard Forward Speed",
    "Standart ileri sürüş hızı"
  ],
  [
    "tr",
    "Standard Gears",
    "Standart vitesler"
  ],
  [
    "tr",
    "Automatic Transmission Ranges",
    "Otomatik şanzıman kademeleri"
  ],
  [
    "tr",
    "Creeper Option",
    "Sürüngen vites seçeneği"
  ],
  [
    "tr",
    "Creeper Transmission",
    "Sürüngen vitesli şanzıman"
  ],
  [
    "tr",
    "Hydraulic Control Modules Additional Optional",
    "İlave opsiyonel hidrolik kumanda modülleri"
  ],
  [
    "tr",
    "Hydraulic Control Modules Standard",
    "Standart hidrolik kumanda modülleri"
  ],
  [
    "tr",
    "Hydraulic Main Flow Standard",
    "Standart ana hidrolik debi"
  ],
  [
    "tr",
    "Overall Length Range",
    "Toplam uzunluk aralığı"
  ],
  [
    "tr",
    "Rear Equipment Deck Load Capacity",
    "Arka ekipman platformu yük kapasitesi"
  ],
  [
    "tr",
    "Standard Transmission Speed Range",
    "Standart şanzıman hız aralığı"
  ],
  [
    "tr",
    "Front 3-Point Hitch Lift Capacity (Optional)",
    "Ön üç nokta askı kaldırma kapasitesi (opsiyonel)"
  ],
  [
    "tr",
    "Hitch Lift Capacity",
    "Askı sistemi kaldırma kapasitesi"
  ],
  [
    "tr",
    "Lifting Capacity (Features)",
    "Kaldırma kapasitesi (donanım özellikleri)"
  ],
  [
    "tr",
    "LPM (Liter Per Minute)",
    "LPM (litre/dakika)"
  ],
  [
    "tr",
    "Main Hydraulic Flow - Optional Pump",
    "Ana hidrolik debi - opsiyonel pompa"
  ],
  [
    "tr",
    "Main Hydraulic Flow - Standard",
    "Ana hidrolik debi - standart"
  ],
  [
    "tr",
    "Rear Hitch Lift",
    "Arka askı kaldırma kapasitesi"
  ],
  [
    "tr",
    "Standard Front Ballast",
    "Standart ön balast"
  ],
  [
    "tr",
    "Synchronised Gearbox",
    "Senkromeçli şanzıman"
  ],
  [
    "tr",
    "Travel Ranges",
    "Sürüş kademeleri"
  ],
  [
    "zh",
    "Arka Diferansiyel Kilidi",
    "后差速锁"
  ],
  [
    "zh",
    "Arka Diferansiyel Kumandası",
    "后差速器控制"
  ],
  [
    "zh",
    "DöRt çEker Kontrolü",
    "四轮驱动控制"
  ],
  [
    "zh",
    "DöRt çEker Kumandası",
    "四轮驱动控制"
  ],
  [
    "zh",
    "Gross Engine Horsepower",
    "发动机总马力"
  ],
  [
    "zh",
    "Gross Weight(Kg) (With Std. Ballast)",
    "总重量（kg，含标准配重）"
  ],
  [
    "zh",
    "Length Range",
    "长度范围"
  ],
  [
    "zh",
    "Motor Hava Filtresi",
    "发动机空气滤清器"
  ],
  [
    "zh",
    "Nominal Engine Power",
    "发动机额定功率"
  ],
  [
    "zh",
    "Nominal Motor GüCü",
    "发动机额定功率"
  ],
  [
    "zh",
    "ÖN Diferansiyel Kilidi",
    "前差速锁"
  ],
  [
    "hi",
    "Engine Max Torque Boost",
    "बूस्ट मोड में अधिकतम इंजन टॉर्क"
  ],
  [
    "hi",
    "Engine Max Torque Normal",
    "सामान्य मोड में अधिकतम इंजन टॉर्क"
  ],
  [
    "hi",
    "Fuel Injection",
    "ईंधन इंजेक्शन"
  ],
  [
    "hi",
    "Manufacturer Engine Power Boost Max Kw",
    "निर्माता के अनुसार बूस्ट मोड में अधिकतम इंजन शक्ति (kW)"
  ],
  [
    "hi",
    "Manufacturer Engine Power Normal Max Kw",
    "निर्माता के अनुसार सामान्य मोड में अधिकतम इंजन शक्ति (kW)"
  ],
  [
    "hi",
    "Power Bulge",
    "रेटेड शक्ति से अधिक उपलब्ध शक्ति"
  ],
  [
    "hi",
    "Weight Without Extra Ballast",
    "अतिरिक्त बैलास्ट के बिना वजन"
  ],
  [
    "hi",
    "Manufacturer Engine Power Kw",
    "निर्माता द्वारा बताई इंजन शक्ति (kW)"
  ],
  [
    "hi",
    "Maximum Front Axle Load",
    "अगले एक्सल पर अधिकतम भार"
  ],
  [
    "hi",
    "Maximum Rear Axle Load",
    "पिछले एक्सल पर अधिकतम भार"
  ],
  [
    "hi",
    "Permissible Total Weight",
    "अनुमत कुल वजन"
  ],
  [
    "hi",
    "Air Filter",
    "एयर फ़िल्टर"
  ],
  [
    "hi",
    "Block Heater",
    "इंजन ब्लॉक हीटर"
  ],
  [
    "hi",
    "Engine Speed At Peak Power",
    "अधिकतम शक्ति पर इंजन की घूर्णन गति"
  ],
  [
    "hi",
    "Engine Speed At Peak Torque",
    "अधिकतम टॉर्क पर इंजन की घूर्णन गति"
  ],
  [
    "hi",
    "Intercooler",
    "इंटरकूलर"
  ],
  [
    "hi",
    "Nominal Power KW",
    "नाममात्र शक्ति (kW)"
  ],
  [
    "hi",
    "Rear Equipment Deck Load Capacity",
    "पिछले उपकरण प्लेटफ़ॉर्म की भार क्षमता"
  ],
  [
    "hi",
    "Battery",
    "बैटरी"
  ],
  [
    "hi",
    "Injection Type",
    "इंजेक्शन का प्रकार"
  ],
  [
    "hi",
    "Length Range",
    "लंबाई की सीमा"
  ],
  [
    "hi",
    "Manufacturer Engine Power",
    "निर्माता द्वारा बताई इंजन शक्ति"
  ],
  [
    "de",
    "Manufacturer Three-Point Lift Capacity",
    "Dreipunkt-Hubkraft laut Hersteller"
  ],
  [
    "de",
    "PTO Control",
    "Zapfwellenbetätigung"
  ],
  [
    "de",
    "Optional Front PTO Clutch",
    "Optionale Frontzapfwellenkupplung"
  ],
  [
    "de",
    "Optional Front PTO Spline Count",
    "Keilzahl der optionalen Frontzapfwelle"
  ],
  [
    "ru",
    "Maximum Front Axle Load",
    "Максимальная нагрузка на переднюю ось"
  ],
  [
    "ru",
    "Maximum Rear Axle Load",
    "Максимальная нагрузка на заднюю ось"
  ],
  [
    "ru",
    "Permissible Total Weight",
    "Допустимая полная масса"
  ],
  [
    "ru",
    "Advertised Engine Power",
    "Заявленная мощность двигателя"
  ],
  [
    "ru",
    "Cylinder Count",
    "Число цилиндров"
  ],
  [
    "ru",
    "Engine Cylinders",
    "Цилиндры двигателя"
  ],
  [
    "ru",
    "Engine Power Category",
    "Категория мощности двигателя"
  ],
  [
    "ru",
    "Rear Equipment Deck Load Capacity",
    "Грузоподъёмность задней платформы для оборудования"
  ],
  [
    "ru",
    "Engine Horsepower",
    "Мощность двигателя в лошадиных силах"
  ],
  [
    "ru",
    "Motor Hava Filtresi",
    "Воздушный фильтр двигателя"
  ],
  [
    "ru",
    "Nominal Engine Power",
    "Номинальная мощность двигателя"
  ],
  [
    "ru",
    "Nominal Motor GüCü",
    "Номинальная мощность двигателя"
  ],
  [
    "ja",
    "Alternator",
    "オルタネーター"
  ],
  [
    "ja",
    "Battery",
    "バッテリー"
  ],
  [
    "ja",
    "Injection Type",
    "噴射方式"
  ],
  [
    "ja",
    "Manufacturer Engine Power",
    "メーカー公表のエンジン出力"
  ]
];
test("119 mandatory-locale audit headings resolve to precise display translations",()=>{
 for(const [locale,source,expected] of auditedHeadings20261125){
   const spec=Object.freeze({spec_name:source,canonical_key:null,spec_value:"100",unit:"kW",measurement_standard:"ISO 14396",rated_rpm:2200,evidence_text:source});
   assert.equal(specLabel(spec,locale),expected,locale+" "+source);
   assert.equal(spec.spec_name,source);assert.equal(spec.spec_value,"100");assert.equal(spec.measurement_standard,"ISO 14396");
   assert.equal(specLabel({...spec,spec_name:source.replaceAll(" ","_")},locale),expected);
 }
});
