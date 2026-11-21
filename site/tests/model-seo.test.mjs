import {readFileSync} from "node:fs";
import assert from "node:assert/strict";
import test from "node:test";
import { modelSeoMetadata, modelStructuredData, originalVariantNote } from "../src/lib/model-seo.ts";

const tractor = {
  tractor_id:"a02c4df2-c719-5a26-abb2-6195cb8e23e5",
  slug:"mccormick-x5-120-a02c4df2",
  brand_name:"McCormick", model_name:"X5.120", variant:"X5 FPT F36 Stage V",
  market:"Europe", model_year:null, horsepower:114,
  brand_country:"Italy", brand_website_url:null,
  engine:null, transmission:null, drivetrain:null, weight_kg:null,
  specifications:[{
    spec_id:"a", spec_name:"Wheelbase",spec_value:"2355",unit:"mm",
    canonical_key:"wheelbase_mm",comparison_class:"dimensions_weights",
    measurement_standard:"Official brochure",rated_rpm:null,
    evidence_text:"Manufacturer model table",verified_at:"2026-11-18T12:00:00Z",
    source_publisher:"McCormick",source_url:"https://www.mccormick-tractors.com/catalog.pdf",
    source_type:"manufacturer_specification",source_accessed_at:null,spec_source_priority:100,
  }],
};

test("SEO titles distinguish model, market and equipment variant", () => {
  const a = modelSeoMetadata(tractor, "tr");
  const b = modelSeoMetadata({ ...tractor, variant:"Different transmission" }, "tr");
  assert.match(a.title,/X5\.120/);
  assert.match(a.title,/Stage V/);
  assert.match(a.title,/Avrupa/);
  assert.notEqual(a.title,b.title);
  assert.match(a.description,/114 HP/);
});

test("technical comparison page uses WebPage and Thing, not a Product/Vehicle rich result", () => {
  const data = modelStructuredData(tractor, "tr", "https://tractorvs.example");
  const graph = data["@graph"];
  const page = graph[0];
  const subject = graph[2];
  const url = "https://tractorvs.example/tr/tractors/mccormick-x5-120-a02c4df2/";
  assert.equal(page.url, url);
  assert.equal(page["@type"], "WebPage");
  assert.equal(page.mainEntity["@id"], url + "#tractor");
  assert.equal(page.about["@id"], url + "#tractor");
  assert.equal(page.inLanguage, "tr");
  assert.equal(subject["@type"], "Thing");
  assert.equal(subject.url, url);
  assert.equal(subject.name, "McCormick X5.120");
  assert.equal(subject.identifier, tractor.tractor_id);
  assert.match(subject.disambiguatingDescription, /Europe/);
  assert.ok(graph.some((part) => part["@type"] === "BreadcrumbList"));
  assert.ok(!graph.some((part) => ["Product", "Vehicle", "Car"].includes(part["@type"])));
  assert.ok(!("offers" in subject) && !("aggregateRating" in subject) && !("review" in subject));
  assert.ok(!("additionalProperty" in subject), "Thing must not claim Product-only properties");
});

test("manufacturer sources are linked without unsupported Product properties", () => {
  const data = modelStructuredData(tractor, "en", "https://tractorvs.example");
  const subject = data["@graph"][2];
  assert.ok(Array.isArray(subject.subjectOf));
  assert.ok(subject.subjectOf.every((source) => source["@type"] === "CreativeWork"));
  assert.match(subject.subjectOf[0].url, /^https:\/\//);
  assert.ok(!("manufacturer" in subject));
});

test("a missing manufacturer source does not create invented citations or offers", () => {
  const clone = {
    ...tractor,
    specifications: tractor.specifications.map((spec) => ({
      ...spec, source_url:null, source_publisher:null, evidence_text:null,
    })),
  };
  const subject = modelStructuredData(clone,"en","https://tractorvs.example")["@graph"][2];
  assert.equal(subject.subjectOf,undefined);
  assert.equal(subject["@type"],"Thing");
  assert.ok(!("offers" in subject));
});

test("long manufacturer citation is kept out of the search title", () => {
  const longVariant = "Serie 5 FPT Stage V; EU official brochure / equipment unspecified";
  const model = { ...tractor, brand_name:"Landini", model_name:"5-085",
    variant:longVariant, market:"Europe", horsepower:75 };
  const seo = modelSeoMetadata(model,"en");
  assert.match(seo.title,/Landini 5-085/);
  assert.match(seo.title,/Serie 5 FPT Stage V/);
  assert.doesNotMatch(seo.title,/brochure|unspecified|global/);
  assert.match(seo.description,/equipment unspecified/);
  assert.ok(seo.title.length < 105);
});

test("non-global markets distinguish otherwise identical equipment", () => {
  const usa=modelSeoMetadata({ ...tractor, market:"US" },"en");
  const eu=modelSeoMetadata({ ...tractor, market:"Europe" },"en");
  assert.notEqual(usa.title,eu.title);
  assert.match(usa.title,/United States/);
});

test("all ten locales have meaningful source-aware, nonempty descriptions", () => {
  const locales = ["en","tr","zh","hi","pt-br","fr","de","ru","ja","es"];
  for (const locale of locales) {
    const a = modelSeoMetadata(tractor,locale);
    assert.ok(a.title.includes("McCormick X5.120"));
    assert.ok(a.description.includes("McCormick X5.120"));
    assert.match(a.description,/114 HP/);
    assert.match(a.description,/Stage V/);
    assert.ok(a.description.length > 75);
    assert.doesNotMatch(a.description,/undefined|null|NaN/);
    const withoutSource = modelSeoMetadata({
      ...tractor,
      specifications:tractor.specifications.map(spec=>({...spec,source_url:null}))
    },locale).description;
    assert.notEqual(a.description,withoutSource,`Source claims must change in ${locale}`);
    assert.ok(withoutSource.length > 75);
  }
});

test("zero specifications and absent engine power remain honest", () => {
  for (const locale of ["en","tr","zh","hi","pt-br","fr","de","ru","ja","es"]) {
    const meta = modelSeoMetadata({...tractor,specifications:[],horsepower:null,variant:null},locale);
    assert.doesNotMatch(meta.description,/114 HP|0 published technical specifications|0 yayımlanmış/);
    assert.ok(meta.description.includes("McCormick X5.120"));
    assert.ok(meta.description.length > (locale === "zh" || locale === "ja" ? 20 : 60));
  }
});

test("model titles and descriptions use each locale's market name without altering identity", () => {
  const expectations = {
    en:"Europe", tr:"Avrupa", zh:"欧洲", hi:"यूरोप", "pt-br":"Europa",
    fr:"Europe", de:"Europa", ru:"Европа", ja:"欧州", es:"Europa"
  };
  for(const [locale, localizedMarket] of Object.entries(expectations)){
    const meta=modelSeoMetadata(tractor,locale);
    assert.ok(meta.title.includes(localizedMarket), `Missing localized market in title: ${locale}`);
    assert.ok(meta.description.includes(localizedMarket), `Missing localized market in description: ${locale}`);
    assert.ok(meta.title.includes("McCormick X5.120"));
    const other=modelSeoMetadata({...tractor,market:"Turkey"},locale);
    assert.notEqual(meta.title,other.title);
  }
});

test("raw semicolon source notes do not leak untranslated into nine localized search descriptions",()=>{
  const model={...tractor,variant:"Serie 5 FPT Stage V; EU official brochure / equipment unspecified"};
  assert.equal(originalVariantNote(model),"EU official brochure / equipment unspecified");
  assert.match(modelSeoMetadata(model,"en").description,/equipment unspecified/);
  for(const locale of ["tr","zh","hi","pt-br","fr","de","ru","ja","es"]){
    const meta=modelSeoMetadata(model,locale);
    assert.ok(meta.title.includes("Serie 5 FPT Stage V"));
    assert.doesNotMatch(meta.description,/EU official brochure|equipment unspecified/);
  }
  const detail=readFileSync(new URL("../src/components/TractorDetail.astro",import.meta.url),"utf8");
  assert.match(detail,/originalVariantNote\(tractor\)/);
  assert.match(detail,/class="model-original-note"/);
  assert.match(detail,/\{originalNote\}/);
});


test("published regional markets and archival unknowns are localized without changing source identity", async () => {
  const { marketDisplayName } = await import("../src/lib/market-display.ts");
  const expected = {
    international: ["International catalogue","Uluslararası katalog"],
    brazil: ["Brazil","Brezilya"],
    "united kingdom": ["United Kingdom","Birleşik Krallık"],
    "south africa": ["South Africa","Güney Afrika"],
    "unspecified (historical catalogue)": ["Market unknown (archive)","Pazar bilinmiyor (arşiv)"],
  };
  for (const [market, [en, tr]] of Object.entries(expected)) {
    assert.equal(marketDisplayName(market,"en"), en);
    assert.equal(marketDisplayName(market,"tr"), tr);
    const m = modelSeoMetadata({ ...tractor, market,variant:"Manufacturer-documented"}, "tr");
    assert.ok(m.title.includes(tr), "localized region must appear in SEO title for "+market);
    assert.ok(m.description.includes(tr), "localized region must appear in SEO description for "+market);
  }
  assert.equal(marketDisplayName("Türkiye","tr"),"Türkiye");
  assert.equal(marketDisplayName("UK","tr"),"Birleşik Krallık");
  assert.equal(marketDisplayName("Model year not stated","tr"),"Model year not stated",
    "do not invent a translation for unknown market value");
  for (const locale of ["en","tr","zh","hi","pt-br","fr","de","ru","ja","es"]) {
    const desc = modelSeoMetadata({...tractor,market:"International",variant:"T194 / Series 1"},locale).description;
    assert.ok(desc.length > 60);
    assert.ok(!desc.includes("undefined"));
    assert.notEqual(marketDisplayName("International",locale),"International",
      "international market label should be explicitly localized as a catalogue for "+locale);
  }
});

test("manufacturer product-page citations are described as sources, not necessarily documents, in ten locales", () => {
  const expected = {
    en:"Manufacturer source links are included where verified.",
    tr:"Doğrulanmış üretici kaynaklarına bağlantılar sunulur.",
    zh:"已提供经核实的制造商来源链接。",
    hi:"सत्यापित निर्माता स्रोतों के लिंक उपलब्ध हैं।",
    "pt-br":"Links para fontes do fabricante são fornecidos quando verificados.",
    fr:"Des liens vers les sources du constructeur sont fournis après vérification.",
    de:"Verifizierte Herstellerquellen sind verlinkt.",
    ru:"Доступны ссылки на проверенные источники производителя.",
    ja:"確認済みメーカー情報源へのリンクを掲載しています。",
    es:"Se incluyen enlaces a fuentes del fabricante cuando están verificadas."
  };
  const productPage = {
    ...tractor,
    specifications: tractor.specifications.map(spec => ({
      ...spec,
      source_url:"https://www.mccormick-tractors.com/en/tractors/x5/",
      source_type:"manufacturer_specification"
    }))
  };
  for(const [locale, sentence] of Object.entries(expected)) {
    const meta = modelSeoMetadata(productPage,locale);
    assert.ok(meta.description.includes(sentence), `Source type misrepresented in ${locale}`);
    assert.ok(meta.title.includes("McCormick X5.120"), `Model identity changed in ${locale}`);
    const noSource = modelSeoMetadata({
      ...productPage,
      specifications:productPage.specifications.map(spec=>({...spec,source_url:null}))
    },locale);
    assert.ok(!noSource.description.includes(sentence), `Unsupported manufacturer claim in ${locale}`);
  }
});

test("very long exact-variant model titles shed only generic boilerplate and preserve identity",()=>{
  const heavy={...tractor,brand_name:"Lamborghini Trattori",model_name:"Spire V 80 Target",
    variant:"Stage V tractor configuration option",market:"Unspecified (historical catalogue)",model_year:2025};
  const locales=["en","tr","zh","hi","pt-br","fr","de","ru","ja","es"];
  for(const locale of locales){
    const x=modelSeoMetadata(heavy,locale);
    assert.ok(x.title.startsWith("Lamborghini Trattori Spire V 80 Target"),locale);
    assert.ok(x.title.includes("Stage V tractor configuration option"),locale);
    assert.ok(x.title.includes("2025"),locale);
    assert.ok(x.title.endsWith(" | TractorVS"),locale);
    assert.ok(!x.title.includes("…")&&!x.title.includes("..."),locale);
    assert.ok(x.description.includes("Stage V tractor configuration option"),locale);
    const alternate=modelSeoMetadata({...heavy,variant:"Different Stage V configuration"},locale);
    assert.notEqual(x.title,alternate.title,locale+" keep variant distinction");
    assert.ok(x.title.length<165,locale+" avoid unbounded generic SEO wording");
  }
});
test("short model SEO titles keep their natural localized specification noun",()=>{
 const x=modelSeoMetadata({...tractor,variant:null,market:"global",model_year:null},"en");
 assert.match(x.title,/McCormick X5.120/);
 assert.match(x.title,/\b(specifications|technical|Specs)\b/i);
 assert.ok(x.title.length<=105);
});


test("actual OEM source-note SEO titles are concise without losing model, drive, Stage V, engine or locale",()=>{
  const cases=[
    {brand_name:"Lamborghini Trattori",model_name:"Spire V 80 Target",
      variant:"Spire S/V Target / Stage V 2025 brochure",
      market:"Europe (manufacturer Stage V 04/2025)",identity:"Stage V"},
    {brand_name:"Lamborghini Trattori",model_name:"Spire S 80 Target",
      variant:"Spire S/V Target / Stage V 2025 brochure",
      market:"Europe (manufacturer Stage V 04/2025)",identity:"Stage V"},
    {brand_name:"Swaraj",model_name:"Target 625 2WD",
      variant:"Target India / exact 2WD or 4WD configuration",
      market:"India (Swaraj Target manufacturer data)",identity:"2WD"},
    {brand_name:"Swaraj",model_name:"Target 625 4WD",
      variant:"Target India / exact 2WD or 4WD configuration",
      market:"India (Swaraj Target manufacturer data)",identity:"4WD"},
    {brand_name:"Swaraj",model_name:"Target 630 4WD",
      variant:"Target India / exact 2WD or 4WD configuration",
      market:"India (Swaraj Target manufacturer data)",identity:"4WD"},
    {brand_name:"Belarus",model_name:"112N-01",
      variant:"Honda GX390 · historical manufacturer catalogue",
      market:"Unspecified (historical catalogue)",identity:"Honda GX390"},
    {brand_name:"Belarus",model_name:"132N",
      variant:"Honda GX390 · historical manufacturer catalogue",
      market:"Unspecified (historical catalogue)",identity:"Honda GX390"},
    {brand_name:"Belarus",model_name:"152",
      variant:"Honda GX390 · historical manufacturer catalogue",
      market:"Unspecified (historical catalogue)",identity:"Honda GX390"}
  ];
  for(const row of cases){
    for(const locale of ["en","tr","zh","hi","pt-br","fr","de","ru","ja","es"]){
      const model={...tractor,...row,model_year:null,horsepower:null};
      const meta=modelSeoMetadata(model,locale);
      assert.ok(meta.title.includes(row.brand_name+" "+row.model_name),locale+" lost exact model");
      assert.ok(meta.title.includes(row.identity),locale+" lost technical variant qualifier");
      assert.ok(meta.title.length<=105,
        locale+" "+row.model_name+" verbose title: "+meta.title.length+" chars "+meta.title);
      assert.ok(!meta.title.includes("brochure"),"editorial bibliography not title");
      assert.ok(!meta.title.includes("Swaraj Target manufacturer data"),"source citation not title");
      const subject=modelStructuredData(model,locale,"https://tractorvs.example")["@graph"][2];
      assert.equal(subject.disambiguatingDescription,row.variant+" · "+row.market,
        "full original source identity stays in structured data: "+locale+" "+row.model_name);
    }
  }
  const swaraj2=modelSeoMetadata({...tractor,...cases[2]},"en");
  const swaraj4=modelSeoMetadata({...tractor,...cases[3]},"en");
  assert.notEqual(swaraj2.title,swaraj4.title,"two and four wheel drive must never collapse");
  const stageS=modelSeoMetadata({...tractor,...cases[1]},"en");
  const stageV=modelSeoMetadata({...tractor,...cases[0]},"en");
  assert.notEqual(stageS.title,stageV.title,"real Spire variants must never collapse");
});

test("unknown long variants and markets are not silently shortened as if they were source-only",()=>{
  const model={...tractor,brand_name:"Swaraj",model_name:"Target 625 4WD",
    variant:"Target India / exact 2WD or 4WD configuration with differential",
    market:"India (Swaraj Target manufacturer data)"};
  const title=modelSeoMetadata(model,"en").title;
  assert.ok(title.includes("configuration with differential"),"unverified variant text was discarded");
  const marketDifferent=modelSeoMetadata({...model,market:"India (separate regional release)"},"en");
  assert.notEqual(title,marketDifferent.title,"non-matching market must remain distinct");
});
