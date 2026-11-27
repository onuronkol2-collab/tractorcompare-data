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
  },{
    spec_id:"rated",spec_name:"Rated engine power",spec_value:"114",unit:"hp",
    canonical_key:"engine_rated_power",comparison_class:"engine",
    measurement_standard:"ECE R120",rated_rpm:2200,
    evidence_text:"Exact McCormick X5.120 source row gives 114 hp rated engine power at 2200 rpm",
    verified_at:"2026-11-18T12:00:00Z",
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

test("SEO never advertises unsupported or conflicting horsepower in any of the ten languages",()=>{
  const locales=["en","tr","zh","hi","pt-br","fr","de","ru","ja","es"];
  const conflicting={...tractor,specifications:[
    ...tractor.specifications,
    {...tractor.specifications[1],spec_id:"conflict",spec_value:"120"},
  ]};
  const unverified={...tractor,specifications:tractor.specifications.filter(x=>x.canonical_key!=="engine_rated_power")};
  const differentPower={...tractor,horsepower:120};
  for(const lang of locales){
    assert.match(modelSeoMetadata(tractor,lang).description,/114 HP/);
    for(const row of [unverified,conflicting,differentPower]){
      const meta=modelSeoMetadata(row,lang);
      assert.ok(!/114 HP|120 HP/.test(meta.description),lang+" unsupported engine output not allowed in search meta");
      assert.match(meta.title,/McCormick X5\.120/);
      assert.ok(meta.description.length>40,lang+" should keep useful technical context");
    }
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
    assert.ok(x.title.includes(heavy.brand_name+" "+heavy.model_name),locale+" core identity missing");
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
    variant:"Target India / differential configuration",
    market:"India (Swaraj Target manufacturer data)"};
  const title=modelSeoMetadata(model,"en").title;
  assert.ok(title.includes("differential configuration"),"unrecognized specific variant must remain in title");
  const marketDifferent=modelSeoMetadata({...model,market:"India (separate regional release)"},"en");
  assert.notEqual(title,marketDifferent.title,"non-matching market must remain distinct");
});

test("model snippet remains concise while full source context stays visible in ten languages",()=>{
 const locales=["en","tr","zh","hi","pt-br","fr","de","ru","ja","es"];
 const longModel={...tractor,brand_name:"Antonio Carraro",model_name:"TONY 8700 V",
  variant:"Europe Stage V / 8700 V model only / hybrid mechanical-hydrostatic; original technical catalogue note",
  market:"Europe",model_year:2025};
 for(const locale of locales){
  const meta=modelSeoMetadata(longModel,locale);
  assert.ok(meta.description.length>=meta.searchDescription.length);
  assert.ok(meta.searchDescription.length<=160,locale+" snippet exceeds editorial cap");
  assert.ok(meta.searchDescription.includes("Antonio Carraro TONY 8700 V"),locale);
  assert.ok(meta.description.includes("original technical catalogue note") || locale!=="en");
  assert.ok(!meta.searchDescription.endsWith("…")&&!meta.searchDescription.endsWith("..."));
  assert.ok(!meta.searchDescription.includes("undefined"));
 }
 const detail=readFileSync(new URL("../src/components/TractorDetail.astro",import.meta.url),"utf8");
 assert.match(detail,/description=\{searchDescription\}/);
 assert.match(detail,/model-hero-description">\{description\}/);
});

test("long TONY 8700 V descriptions preserve source identity and differentiate ten locales",()=>{
 const model={...tractor,brand_name:"Antonio Carraro",model_name:"TONY 8700 V",
  variant:"Europe Stage V / 8700 V model only / hybrid mechanical-hydrostatic / Deutz 2900cc / cab 2525-2725 kg",
  market:"Europe",model_year:null,horsepower:null};
 const labels={en:/specs|specifications/i,tr:/özellik|teknik/i,zh:/技术参数/,hi:/तकनीकी विवरण/,
  "pt-br":/ficha técnica|especificações/i,fr:/fiche technique|caractéristiques/i,de:/daten|technische/i,
  ru:/характеристик|техническ/i,ja:/仕様|諸元/,es:/datos técnicos|especificaciones/i};
 const snippets=Object.entries(labels).map(([locale,label])=>{
  const meta=modelSeoMetadata(model,locale);
  assert.match(meta.searchDescription,label,locale+" localized context");
  assert.ok(meta.searchDescription.includes(model.variant),locale+" complete variant");
  assert.ok(meta.searchDescription.includes("Antonio Carraro TONY 8700 V"),locale+" identity");
  assert.ok(!meta.searchDescription.includes("114 HP"),locale+" unsupported power");
  return meta.searchDescription;
 });
 assert.equal(new Set(snippets).size,10);
 const empty={...model,specifications:[],variant:model.variant+" / extended exact transmission identity"};
 assert.match(modelSeoMetadata(empty,"en").searchDescription,/Technical specifications have not yet been published/i);
});

test("concise snippet never invents horsepower when headline evidence conflicts",()=>{
 const inconsistent={...tractor,horsepower:135};
 for(const locale of ["en","tr","zh","hi","pt-br","fr","de","ru","ja","es"]){
  const meta=modelSeoMetadata(inconsistent,locale);
  assert.ok(!/135 HP/.test(meta.searchDescription),locale);
  assert.ok(meta.searchDescription.length<=160,locale);
 }
});

test("brand origin localizes separately from the market and preserves unknown names",async()=>{
 const {brandCountryName,BRAND_COUNTRY_LABEL}=await import("../src/lib/market-display.ts");
 assert.equal(brandCountryName("Italy","tr"),"İtalya");
 assert.equal(brandCountryName("South Korea","de"),"Südkorea");
 assert.equal(brandCountryName("Unspecified historical record","tr"),"Unspecified historical record");
 assert.equal(Object.keys(BRAND_COUNTRY_LABEL).length,10);
});

test("locale-specific model titles preserve technical identity without chasing a 60-character tool score",()=>{
  const model={...tractor,brand_name:"Antonio Carraro",model_name:"TIGRE 3800",
    variant:"Stage V",market:"Europe",model_year:null};
  for(const locale of ["en","tr","zh","hi","pt-br","fr","de","ru","ja","es"]){
    const meta=modelSeoMetadata(model,locale);
    assert.ok(meta.title.length<=105,locale+" avoid unbounded title: "+meta.title);
    assert.ok(meta.title.includes("Antonio Carraro TIGRE 3800"),locale);
    assert.ok(meta.title.includes("Stage V"),locale+" variant lost");
    assert.ok(!meta.title.includes("…"),locale+" never truncate actual identity");
    assert.notEqual(meta.title,
      modelSeoMetadata({...model,market:"Turkey"},locale).title,
      locale+" regional identities must stay distinct");
  }
});

test("all ten locale titles stay distinct when the model, market, and variant are identical",()=>{
  // This exact published model previously returned one identical English-like
  // title for FR/HI/PT-BR/RU despite correctly translated page bodies.
  const model={...tractor,brand_name:"Antonio Carraro",model_name:"TIGRE 3800",
    variant:"Stage V",market:"global",model_year:null};
  const localizedNouns={
    en:/specs|specifications/i,
    tr:/özellik/i,
    zh:/技术参数/,
    hi:/तकनीकी विवरण/,
    "pt-br":/ficha técnica/i,
    fr:/fiche technique/i,
    de:/daten|technische/i,
    ru:/характеристики/i,
    ja:/仕様|諸元/,
    es:/datos técnicos|especificaciones/i
  };
  const titles=Object.entries(localizedNouns).map(([locale,noun])=>{
    const title=modelSeoMetadata(model,locale).title;
    assert.match(title,noun,locale+" must have a naturally localized technical noun");
    assert.ok(title.includes("Antonio Carraro TIGRE 3800"),locale+" model lost");
    assert.ok(title.includes("Stage V"),locale+" actual configuration lost");
    assert.ok(title.length<=105,locale+" unreasonable title length: "+title);
    assert.ok(!/brochure|source document|unspecified equipment/i.test(title),
      locale+" editorial/source notes must not leak into SEO title");
    return title;
  });
  assert.equal(new Set(titles).size,10,
    "no two language-specific page titles should collapse to the same generic identity");
});

test("unavoidable long identities are not truncated to pass an arbitrary SEO threshold",()=>{
  const model={...tractor,brand_name:"Lamborghini Trattori",model_name:"Spire V 80 Target",
    variant:"Stage V tractor configuration option",market:"Europe",model_year:2025};
  for(const locale of ["en","tr","zh","hi","pt-br","fr","de","ru","ja","es"]){
    const meta=modelSeoMetadata(model,locale);
    assert.ok(meta.title.includes("Lamborghini Trattori Spire V 80 Target"),locale);
    assert.ok(meta.title.includes("Stage V tractor configuration option"),locale);
    assert.ok(meta.title.includes("2025"),locale);
    assert.ok(!meta.title.includes("…"),locale);
    assert.ok(meta.title.length<=105 || meta.title.includes("Stage V tractor configuration option"),locale);
  }
});

test("model titles keep real variant identity even when optional site suffix is removed",()=>{
  const model={...tractor,brand_name:"Belarus",model_name:"922.4",
    variant:"MTW 922 / Stage IIIa",market:"global",model_year:null};
  for(const locale of ["en","tr","zh","hi","pt-br","fr","de","ru","ja","es"]){
    const title=modelSeoMetadata(model,locale).title;
    assert.ok(title.includes("Belarus 922.4"),locale+" model identity missing");
    assert.ok(title.includes("MTW 922 / Stage IIIa"),locale+" technical variant missing");
    assert.ok(title.length<=105,locale+" excessively long title");
  }
});

test("long model titles drop only optional site boilerplate and preserve identity",()=>{
  const model={...tractor,brand_name:"TYM",model_name:"T3035",
    variant:"F36 / Series 3",market:"International",model_year:null};
  for(const locale of ["en","tr","zh","hi","pt-br","fr","de","ru","ja","es"]){
    const title=modelSeoMetadata(model,locale).title;
    assert.ok(title.length<=105,locale+" full technical identity must remain readable: "+title);
    assert.ok(title.includes("TYM T3035"),locale);
    assert.ok(title.includes("F36 / Series 3"),locale+" lost real variant");
    assert.ok(!title.includes("…"),locale);
    const alternate=modelSeoMetadata({...model,variant:"F36 / Series 4"},locale).title;
    assert.notEqual(title,alternate,locale+" should not collapse different variants");
  }
});

test("verified source-note prose is not part of model title, stays in body and structured data",()=>{
  const examples=[
    {brand_name:"Agrale",model_name:"4125 Cargo",variant:"Brazil / Cargo / NBR ISO 1585 25 cv at 2400rpm",market:"Brazil"},
    {brand_name:"Lamborghini Trattori",model_name:"Spire F 80 Target",variant:"Stage V / F 80 model / OEM brochure 04-2025",market:"Europe"}
  ];
  for(const item of examples){
    for(const locale of ["en","tr","zh","hi","pt-br","fr","de","ru","ja","es"]){
      const model={...tractor,...item,model_year:null};
      const meta=modelSeoMetadata(model,locale);
      assert.ok(meta.title.includes(item.brand_name+" "+item.model_name),locale);
      assert.doesNotMatch(meta.title,/NBR ISO 1585|OEM brochure/,locale);
      assert.ok(meta.title.length<=105,locale+" verified technical identity should remain legible: "+meta.title);
      assert.ok(meta.description.includes("Cargo") || meta.description.includes("Stage V"),locale);
      const original=modelStructuredData(model,locale,"https://tractorvs.example")["@graph"][2].disambiguatingDescription;
      assert.ok(original.includes(item.variant),locale+" full note stays in structured data");
    }
  }
});

test("Deutz 5D GS and non-GS preserve distinct localized SEO titles in ten languages",()=>{
  for(const modelName of ["5065 D","5075 D"]){
    const nonGS={...tractor,brand_name:"Deutz-Fahr",model_name:modelName,
      variant:"5D Series (non-GS) / Stage V (Türkiye 2025 manufacturer brochure)",
      market:"Türkiye",model_year:null};
    const gs={...nonGS,
      variant:"5D Series GS / Stage V (Türkiye 2025 manufacturer brochure)"};
    for(const locale of ["en","tr","zh","hi","pt-br","fr","de","ru","ja","es"]){
      const regular=modelSeoMetadata(nonGS,locale).title;
      const special=modelSeoMetadata(gs,locale).title;
      assert.notEqual(regular,special,locale+" "+modelName+" GS collision");
      assert.ok(regular.includes("5D non-GS"),locale+" non-GS lost");
      assert.ok(special.includes("5D GS"),locale+" GS lost");
      assert.ok(regular.includes("Stage V")&&special.includes("Stage V"),locale);
      assert.ok(regular.includes("Deutz-Fahr "+modelName),locale);
      assert.ok(special.includes("Deutz-Fahr "+modelName),locale);
      assert.ok(regular.length<=105&&special.length<=105,
        locale+" verified GS and non-GS identities must remain legible: "+regular+" / "+special);
      assert.doesNotMatch(regular,/brochure|2025/,locale+" source date not model year");
      assert.doesNotMatch(special,/brochure|2025/,locale+" source date not model year");
      const subject=modelStructuredData(nonGS,locale,"https://tractorvs.example")["@graph"][2];
      assert.ok(subject.disambiguatingDescription.includes(nonGS.variant),
        locale+" raw source note must remain available");
    }
  }
});

test("unknown Deutz equipment variants are never silently classified as the known 5D source case",()=>{
  const unknown={...tractor,brand_name:"Deutz-Fahr",model_name:"5065 D",
    variant:"5D Series GS / Stage V special power shuttle",market:"Türkiye",model_year:null};
  const title=modelSeoMetadata(unknown,"en").title;
  assert.ok(title.includes("special power shuttle"));
  assert.ok(title.includes("Deutz-Fahr 5065 D"));
});

test("seven exactly verified brochure-note rows have concise, honest titles in every locale",()=>{
 const rows=[
  {brand_name:"McCormick",model_name:"X5.085",
   variant:"Stage V X5.085 / 09-2023 brochure",
   market:"Europe / Turkey (manufacturer 09/2023)",identity:["Stage V"],notTitle:["brochure","manufacturer 09/2023"]},
  {brand_name:"Steyr",model_name:"6440 CERVUS CVT",
   variant:"CERVUS CVT",market:"International (STEYR 2025 brochure)",
   identity:["CERVUS CVT"],notTitle:["STEYR 2025 brochure"]},
  {brand_name:"Valtra",model_name:"T215",
   variant:"T Series",market:"Europe / UK 2025 manufacturer brochure",
   identity:["T Series"],notTitle:["2025 manufacturer brochure"]},
  {brand_name:"Yanmar",model_name:"YT347",
   variant:"YT3 i-HMT; ROPS and CAB configurations",
   market:"Turkey (manufacturer YT3 model table)",identity:["YT3 i-HMT"],
   notTitle:["manufacturer YT3 model table"]},
  {brand_name:"Mahindra",model_name:"JIVO 225 DI",
   variant:"India 2WD / 8F x 4R / manufacturer configuration",market:"India",
   identity:["2WD","8F x 4R"],notTitle:["manufacturer configuration"]},
  {brand_name:"Mahindra",model_name:"JIVO 245 DI",
   variant:"India 4WD / 8F x 4R / exact JIVO 245 DI",market:"India",
   identity:["4WD","8F x 4R"],notTitle:["exact JIVO"]},
  {brand_name:"Sonalika",model_name:"Tiger DI 55 III",
   variant:"India / Tiger DI 55 III original / 12F×3R",market:"India",
   identity:["12F×3R"],notTitle:["original /"]}
 ];
 for(const row of rows){
  for(const locale of ["en","tr","zh","hi","pt-br","fr","de","ru","ja","es"]){
   const model={...tractor,...row,model_year:null,horsepower:null};
   const title=modelSeoMetadata(model,locale).title;
   assert.ok(title.includes(row.brand_name+" "+row.model_name),locale+" core model lost: "+title);
   for(const fragment of row.identity)
    assert.ok(title.includes(fragment),locale+" real equipment lost: "+title);
   for(const phrase of row.notTitle)
    assert.ok(!title.includes(phrase),locale+" bibliography leaked: "+title);
   assert.ok(title.length<=105,locale+" source-note title still verbose: "+title);
   const full=modelStructuredData(model,locale,"https://tractorvs.example")["@graph"][2].disambiguatingDescription;
   assert.ok(full.includes(row.variant),locale+" source record variant must stay intact");
   assert.ok(full.includes(row.market),locale+" real market and provenance stay in JSON-LD");
  }
 }
});

test("brochure-note cleanup does not generalize to an unreviewed variant or market",()=>{
 const altered={...tractor,brand_name:"McCormick",model_name:"X5.085",
  variant:"Stage V X5.085 / 09-2024 brochure",market:"Europe / Turkey (manufacturer 09/2023)",
  model_year:null};
 const title=modelSeoMetadata(altered,"en").title;
 assert.ok(title.includes("09-2024 brochure"),"the unexpected raw variant must not be silently shortened");
});

test("reviewed manufacturer families strip only bibliography from headings in ten languages",()=>{
 const rows=[
  ["Valtra","A105","A Series Gen5 Stage V / HiTech 4","International (2025 brochure)",["Stage V","HiTech 4"]],
  ["Valtra","F75","F Series","Europe / UK 2025 manufacturer brochure",["F Series"]],
  ["Valtra","G125e","G Series ECO","Europe / UK 2025 manufacturer brochure",["G Series ECO"]],
  ["Valtra","N155e","N Series EcoPower","Europe / UK 2025 manufacturer brochure",["EcoPower"]],
  ["Valtra","Q245","Q Series","Europe / UK 2025 manufacturer brochure",["Q Series"]],
  ["Valtra","S416","S Series","Europe / Valtra 2025–26 manufacturer documents",["S Series"]],
  ["Valtra","T235","T Series Direct","Europe / UK 2025 manufacturer brochure",["Direct"]],
  ["Valtra","T235","T Series HiTech/Active/Versu","Europe / UK 2025 manufacturer brochure",["HiTech/Active/Versu"]],
  ["Steyr","6360 CERVUS CVT","CERVUS CVT","International (STEYR 2025 brochure)",["CERVUS CVT"]],
  ["Steyr","6170 IMPULS","IMPULS","International (2026 manufacturer brochure)",["IMPULS"]],
  ["SAME","DORADO NATURAL 100.4","Stage IIIA / 2019 brochure","Europe",["Stage IIIA"]],
  ["Landini","2-050","Serie 2 / Tier 3 / 2017 brochure","Italy",["Serie 2","Tier 3"]],
  ["Zetor","6130","6 Series / Stage V · manufacturer table","International (Stage V specification)",["Stage V"]],
  ["Yanmar","YT359","YT3 i-HMT; ROPS and CAB configurations","Turkey (manufacturer YT3 model table)",["YT3 i-HMT"]],
  ["Mahindra","JIVO 225 DI 4WD","India 4WD / 8F x 4R / manufacturer configuration","India",["4WD","8F x 4R"]],
  ["Mahindra","YUVRAJ 215 NXT","India 2WD / 6F x 3R / manufacturer configuration","India",["2WD","6F x 3R"]],
  ["Mahindra","JIVO 305 DI 4WD","India 4WD / 8F x 4R / manufacturer specification; PTO source conflict","India",["4WD","8F x 4R"]]
 ];
 for(const [brand_name,model_name,variant,market,fragments] of rows){
  for(const locale of ["en","tr","zh","hi","pt-br","fr","de","ru","ja","es"]){
   const record={...tractor,brand_name,model_name,variant,market,model_year:null,horsepower:null};
   const title=modelSeoMetadata(record,locale).title;
   assert.ok(title.includes(brand_name+" "+model_name),locale+" core identity missing: "+title);
   for(const word of fragments)
    assert.ok(title.includes(word),locale+" real equipment lost: "+title);
   assert.doesNotMatch(title,/brochure|manufacturer (?:table|documents)/i,locale+" source wording in title");
   assert.ok(title.length<=105,locale+" unexpectedly long reviewed title: "+title);
   const schema=modelStructuredData(record,locale,"https://tractorvs.example")["@graph"][2].disambiguatingDescription;
   assert.ok(schema.includes(variant)&&schema.includes(market),locale+" original source and market must remain available");
  }
 }
 const variants=["T Series Direct","T Series HiTech/Active/Versu"].map(variant=>
  modelSeoMetadata({...tractor,brand_name:"Valtra",model_name:"T235",variant,
    market:"Europe / UK 2025 manufacturer brochure",model_year:null},"en").title);
 assert.notEqual(variants[0],variants[1],"distinct Valtra T235 transmissions must not collapse");
});


test("Chinese SEO preview explains verified OEM sources without overclaiming or losing identity",()=>{
  const item={...tractor,variant:null,market:null,model_year:null,horsepower:null};
  const {title,searchDescription,description}=modelSeoMetadata(item,"zh");
  assert.ok(title.includes("McCormick X5.120"));
  assert.match(searchDescription,/已提供经核实的制造商来源链接。/);
  assert.match(searchDescription,/核对具体车型与技术参数/);
  assert.ok(searchDescription.length>=55 && searchDescription.length<=160,
    "Chinese indexed preview stays accurate, readable and not truncated");
  assert.ok(description.includes(searchDescription.slice(0,20)));
  const unverified={...item,specifications:[]};
  const noSources=modelSeoMetadata(unverified,"zh");
  assert.doesNotMatch(noSources.searchDescription,/已提供经核实的制造商来源链接/);
  assert.match(noSources.searchDescription,/暂无已发布/);
});

test("LS MT573CPS keeps its actual power shuttle cab and market in search titles",()=>{
  const model={...tractor,brand_name:"LS Tractor",model_name:"MT573CPS",market:"US",
    variant:"US official product / power shuttle cab"};
  for(const locale of ["en","tr","de","fr","es","ru","hi","ja","zh","pt-br"]) {
    const {title}=modelSeoMetadata(model,locale);
    assert.match(title,/LS Tractor MT573CPS/);
    assert.match(title,/power shuttle cab/);
    assert.doesNotMatch(title,/official product/);
  }
  assert.match(modelSeoMetadata({...model,variant:"US special cab"},"en").title,/US special cab/);
});

test("a short search description preserves the independent provenance when the long sentence cannot fit",()=>{
  const model={...tractor,brand_name:"Belarus",model_name:"510",market:null,
    variant:"D-244 / 2WD / canopy",horsepower:null,specifications:[{...tractor.specifications[0],
      source_type:"independent_catalog",source_publisher:"TractorData",
      source_url:"https://www.tractordata.com/farm-tractors/example.html",
      evidence_text:"Third-party reported specification from the independent technical database."}]};
  const {searchDescription}=modelSeoMetadata(model,"en");
  assert.match(searchDescription,/Independent reference \(not manufacturer-verified\)/);
  assert.ok(searchDescription.length<=160);
});


test("reviewed redundant title labels retain model, equipment, market and original source identity",()=>{
 const cases=[
  {brand_name:"McCormick",model_name:"X4.120 F Platform",variant:"Orchard F / Platform / Speed Four",market:"Europe",keep:["Platform","Orchard","Speed Four"],drop:"Orchard F / Platform"},
  {brand_name:"McCormick",model_name:"X6.414 P6-Drive",variant:"P6-Drive / standard gearbox",market:"Europe",keep:["P6-Drive","standard gearbox"],drop:"P6-Drive / standard gearbox"},
  {brand_name:"McCormick",model_name:"X7.418 P6-Drive",variant:"Clever Cab / P6-Drive",market:"Europe",keep:["Clever Cab","P6-Drive"],drop:"Clever Cab / P6-Drive"},
  {brand_name:"Mahindra",model_name:"NOVO 755 DI PP 4WD V1",variant:"India 4WD / 15F x 15R / creeper optional",market:"India",keep:["4WD","15F x 15R","creeper optional"],drop:"India 4WD /"},
  {brand_name:"Mahindra",model_name:"JIVO 225 DI 4WD NT",variant:"India 4WD / 8F x 4R / narrow track",market:"India",keep:["4WD","8F x 4R","narrow track"],drop:"India 4WD /"}
 ];
 const locales=["en","tr","zh","hi","pt-br","fr","de","ru","ja","es"];
 for(const row of cases){
  let compacted=0;
  for(const locale of locales){
   const record={...tractor,...row,model_year:null,horsepower:null};
   const meta=modelSeoMetadata(record,locale);
   assert.ok(meta.title.includes(row.brand_name+" "+row.model_name),locale+" model");
   for(const label of row.keep)assert.ok(meta.title.includes(label),locale+" "+row.model_name+" lost "+label);
   if(!meta.title.includes(row.drop))compacted++;
   assert.ok(meta.description.includes(row.variant),locale+" raw variant in description");
   assert.equal(modelStructuredData(record,locale,"https://tractorvs.example")["@graph"][2].disambiguatingDescription,row.variant+" · "+row.market);
  }
  // A reviewed short title stays unchanged; only known long examples need a reduction.
  if(row.model_name!=="X7.418 P6-Drive")assert.ok(compacted>0,row.model_name+" no title improvement");
 }
 const base={...tractor,brand_name:"McCormick",model_name:"X7.418 P6-Drive",market:"Europe",model_year:null};
 for(const locale of locales){
  assert.notEqual(modelSeoMetadata({...base,variant:"Clever Cab / P6-Drive"},locale).title,modelSeoMetadata({...base,variant:"Efficient / P6-Drive"},locale).title);
  const unknown=modelSeoMetadata({...base,variant:"Clever Cab / P6-Drive / special axle"},locale);
  assert.ok(unknown.title.includes("special axle"),locale+" unknown equipment not removed");
 }
});


test("reviewed remaining title compaction preserves exact TYM variants, markets and original source data",()=>{
  const locales=["en","tr","zh","hi","pt-br","fr","de","ru","ja","es"];
  const variants=["5025C / cab / 12F x 12R","5025CH / cab / 3-range HST",
    "5025H / 3-range HST / ROPS","5025R / 12F x 12R / ROPS"];
  for(const locale of locales){
    const titles=variants.map(variant=>{
      const row={...tractor,brand_name:"TYM",model_name:"T4048",market:"International",variant,model_year:null};
      const meta=modelSeoMetadata(row,locale);
      assert.ok(meta.title.includes("TYM T4048"),locale);
      assert.ok(meta.title.includes(variant.split(" / ")[0]),locale+" alias lost");
      for(const term of variant.split(" / ").slice(1))
        assert.ok(meta.title.includes(term)||meta.title.includes(term.replaceAll(" x ","×")),locale+" "+term);
      assert.ok(meta.description.includes(variant),locale+" full variant in source description");
      assert.equal(modelStructuredData(row,locale,"https://tractorvs.example")["@graph"][2].disambiguatingDescription,variant+" · International");
      return meta.title;
    });
    assert.equal(new Set(titles).size,variants.length,locale+" distinct equipment variants");
  }
  const row={...tractor,brand_name:"TYM",model_name:"T4048",market:"International",variant:variants[0],model_year:null};
  const known=modelSeoMetadata(row,"de").title;
  assert.ok(known.length<=60,known);
  const unknown=modelSeoMetadata({...row,variant:"5025C / cab / 12F x 12R / special axle"},"de").title;
  assert.ok(unknown.includes("special axle"),unknown);
  assert.ok(unknown.includes("Internationaler Katalog"),unknown);
  const other=modelSeoMetadata({...row,market:"Europe"},"de").title;
  assert.notEqual(known,other);
});

test("reviewed Sonalika title removes repeated market or model names without losing configuration",()=>{
 const rows=[
  ["DI 35","2WD DI 35 / RX / Sikander family options","India",["2WD","RX","Sikander"]],
  ["DI 30 Baagban","India 2WD / orchard / 8F+2R / rear tire options","India",["2WD","orchard","8F+2R","rear tire options"]],
  ["GT 20","India 2WD 6F+2R / single clutch / tyre options","India",["2WD","6F+2R","single clutch","tyre options"]],
  ["FP-18","Manufacturer export FP-18 / 2WD","International",["2WD","export"]],
 ];
 for(const [model_name,variant,market,keep] of rows){
  const row={...tractor,brand_name:"Sonalika",model_name,variant,market,model_year:null};
  for(const locale of ["en","tr","zh","hi","pt-br","fr","de","ru","ja","es"]){
   const meta=modelSeoMetadata(row,locale);
   assert.ok(meta.title.includes("Sonalika "+model_name),locale);
   for(const term of keep)assert.ok(meta.title.includes(term),locale+" "+term);
   assert.ok(meta.description.includes(variant),locale);
   assert.equal(modelStructuredData(row,locale,"https://tractorvs.example")["@graph"][2].disambiguatingDescription,variant+" · "+market);
  }
 }
});


test("Başak 5120 and other medium-length identities retain localized technical titles in every language",()=>{
  const cases=[
    {...tractor,brand_name:"Başak Traktör",model_name:"5120",variant:"Red Power · 4WD · Stage V",market:"global",model_year:null},
    {...tractor,brand_name:"Antonio Carraro",model_name:"TIGRE 3800",variant:"Stage V / 4WD",market:"global",model_year:null},
  ];
  const nouns={en:/specs|specifications/i,tr:/özellik/i,zh:/技术参数/,hi:/तकनीकी विवरण/,
    "pt-br":/ficha técnica/i,fr:/fiche technique/i,de:/daten|technische/i,
    ru:/характеристики/i,ja:/仕様|諸元/,es:/datos técnicos|especificaciones/i};
  for(const model of cases){
    const titles=Object.entries(nouns).map(([locale,noun])=>{
      const meta=modelSeoMetadata(model,locale);
      assert.match(meta.title,noun,locale+" localized technical noun");
      assert.ok(meta.title.includes(model.brand_name+" "+model.model_name),locale);
      assert.ok(meta.title.includes(model.variant),locale+" exact equipment identity");
      assert.ok(meta.title.length<=105,locale+" no gratuitous length");
      assert.ok(meta.description.includes(model.variant),locale+" source identity");
      assert.notEqual(meta.title,modelSeoMetadata({...model,variant:"Different equipment"},locale).title);
      return meta.title;
    });
    assert.equal(new Set(titles).size,10,"localized titles must not collapse at the advisory length boundary");
  }
});


test("source-matched engine power takes priority over generic counts in model snippets",()=>{
 const locales=["en","tr","zh","hi","pt-br","fr","de","ru","ja","es"];
 const model={...tractor,variant:"X5 FPT F36 Stage V / exact configuration / transmission equipment"};
 for(const locale of locales){
  const meta=modelSeoMetadata(model,locale);
  assert.ok(meta.searchDescription.includes(model.variant),locale+" exact variant retained");
  assert.ok(meta.searchDescription.includes("114 HP"),locale+" verified fact prioritized");
  assert.ok(meta.searchDescription.length<=160,locale);
  const conflicting=modelSeoMetadata({...model,horsepower:135},locale);
  assert.ok(!conflicting.searchDescription.includes("135 HP"),locale+" unsupported fact forbidden");
 }
});

test("long model identity is never silently discarded to fit an arbitrary snippet length",()=>{
 const variant="Exact manufacturer configuration with specialised transmission and axle equipment / additional hydraulic package / particular regional configuration / additional transmission and factory axle options";
 const model={...tractor,variant,model_year:2025};
 for(const locale of ["en","tr","zh","hi","pt-br","fr","de","ru","ja","es"]){
  const meta=modelSeoMetadata(model,locale);
  assert.ok(meta.searchDescription.includes(variant),locale+" exact variant");
  assert.ok(meta.searchDescription.includes("2025"),locale+" year");
  assert.ok(!meta.searchDescription.includes("114 HP"),locale+" no orphaned power assertion");
  assert.ok(!meta.searchDescription.endsWith("…"));
 }
});


test("independently reported power retains its qualifier in a constrained search snippet",()=>{
 const model={...tractor,brand_name:"Belarus",model_name:"510",variant:"D-244 / 2WD",market:null,
  specifications:[{...tractor.specifications[1],source_type:"independent_catalog",
   source_publisher:"TractorData",source_url:"https://www.tractordata.com/farm-tractors/example.html",
   evidence_text:"Third-party reported specification from the independent technical database."}]};
 const meta=modelSeoMetadata(model,"en");
 assert.match(meta.searchDescription,/Independent reference \(not manufacturer-verified\)/);
 assert.match(meta.searchDescription,/114 HP/);
 assert.ok(meta.searchDescription.length<=160);
 const constrained=modelSeoMetadata({...model,variant:"D-244 / 2WD / regional configuration with additional transmission equipment and other variants"},"en");
 assert.doesNotMatch(constrained.searchDescription,/114 HP/);
});


test("reviewed Turkish and regional model titles preserve exact equipment and source data",()=>{
 const locales=["en","tr","zh","hi","pt-br","fr","de","ru","ja","es"];
 const cases=[
  {brand_name:"Farmtrac",model_name:"45 Powermaxx",variant:"India / 2WD / constant-mesh 8F+2R",market:"India",must:["2WD","constant-mesh 8F+2R"]},
  {brand_name:"Farmtrac",model_name:"60 Powermaxx",variant:"India / 2WD / T20 16F+4R",market:"India",must:["2WD","T20 16F+4R"]},
  {brand_name:"Hattat",model_name:"B 3055",variant:"Stage V · 4WD · ROPS · 12F/12R",market:"Türkiye",must:["Stage V","4WD","ROPS","12F/12R"]},
  {brand_name:"Erkunt",model_name:"Nimet 75 E+",variant:"CRD5 eCapra · 4WD · kabin · 24F/24R",market:"Türkiye",must:["CRD5 eCapra","4WD","24F/24R"]},
  {brand_name:"IRUM",model_name:"TAGRO 102",variant:"Stage V / F36 FPT / 12F-12R / 4WD / cab",market:"Romania",must:["Stage V","F36 FPT","12F-12R","4WD","cab"]},
  {brand_name:"Iseki",model_name:"T97 Series",variant:"T97 Cabin / T97 ROPS (manufacturer specification)",market:"International (ISEKI global catalogue)",must:["Cabin","ROPS"]},
  {brand_name:"Iseki",model_name:"TXGS24",variant:"UK official TXGS24 brochure / 4WD hydrostatic / ROPS",market:"United Kingdom",must:["4WD hydrostatic","ROPS"]},
  {brand_name:"Iseki",model_name:"TG6687",variant:"TG6 Stage V / Power shuttle / ROPS / WJRE4",market:"Europe",must:["Stage V","Power shuttle","ROPS","WJRE4"]}
 ];
 for(const {must,...row} of cases) for(const locale of locales){
  const model={...tractor,...row,model_year:null};
  const m=modelSeoMetadata(model,locale);
  assert.ok(m.title.includes(row.brand_name+" "+row.model_name),locale+" model");
  for(const value of must)assert.ok(m.title.includes(value),locale+" lost "+value+": "+m.title);
  assert.doesNotMatch(m.title,/manufacturer specification|UK official TXGS24 brochure|ISEKI global catalogue/);
  assert.equal(modelStructuredData(model,locale,"https://tractorvs.example")["@graph"][2].disambiguatingDescription,row.variant+" · "+row.market);
 }
 const one={...tractor,...cases.at(-1),model_year:null};
 const other={...one,variant:"TG6 Stage V / HST / cab / HMWJCYE4"};
 for(const locale of locales)assert.notEqual(modelSeoMetadata(one,locale).title,modelSeoMetadata(other,locale).title);
 const farm={...tractor,...cases[0],model_year:null};
 assert.equal((modelSeoMetadata(farm,"en").title.match(/India/g)||[]).length,1);
 assert.ok(modelSeoMetadata({...farm,variant:"India / 2WD / different gearing"},"en").title.includes("different gearing"));
});


test("full live SEO audit follow-up preserves reviewed model identity and compact metadata",async()=>{
 const {REVIEWED_LONG_TITLE_ROWS}=await import("../src/lib/reviewed-long-model-title-identities.ts");
 const locales=["en","tr","zh","hi","pt-br","fr","de","ru","ja","es"];
 const names=["TONY 8700 V","TONY 8900 TRG","804 Fruit Garden Cabin","804.4 Fruit Garden ROPS","YM347","YM359"];
 const rows=REVIEWED_LONG_TITLE_ROWS.filter(row=>names.includes(row.model));
 assert.equal(rows.length,6);
 for(const row of rows){
  const m={...tractor,brand_name:row.brand,model_name:row.model,variant:row.rawVariant,market:row.rawMarket,model_year:row.year,horsepower:null};
  const titles=new Set(),snippets=new Set();
  for(const lang of locales){
   const meta=modelSeoMetadata(m,lang);
   assert.ok(meta.title.includes(row.brand+" "+row.model),lang);
   assert.ok(meta.title.includes(row.variant),lang+" full reviewed equipment");
   assert.ok(meta.title.length<=105,lang+" "+meta.title);
   assert.ok(meta.searchDescription.length<=160,lang+" "+meta.searchDescription);
   assert.ok(meta.description.includes(row.rawVariant),lang+" raw evidence");
   assert.equal(modelStructuredData(m,lang,"https://tractorvs.example")["@graph"][2].disambiguatingDescription,row.rawVariant+" · "+row.rawMarket);
   assert.doesNotMatch(meta.searchDescription,/114 HP/);
   titles.add(meta.title);snippets.add(meta.searchDescription);
  }
  assert.equal(titles.size,10,row.model+" locale title identity");
  assert.equal(snippets.size,10,row.model+" locale snippet identity");
 }
});


test("nominal search facts use manufacturer-reviewed capacity, not guessed specifications, in ten locales",()=>{
 const base={...tractor.specifications[0],canonical_key:"engine_displacement_l",spec_name:"Displacement",spec_value:"3",unit:"l",measurement_standard:null};
 const row={...tractor,variant:null,market:null,horsepower:null,specifications:[base]};
 const labels={en:/Manufacturer: 3 L engine displacement/,tr:/Üretici verisi: 3 L motor hacmi/,zh:/发动机排量 3 L/,hi:/इंजन क्षमता: 3 L/,"pt-br":/cilindrada do motor de 3 L/,fr:/cylindrée de 3 L/,de:/3 l Hubraum/,ru:/объём двигателя 3 л/,ja:/排気量：3 L/,es:/cilindrada de 3 L/};
 for(const [lang,re] of Object.entries(labels)){
  const meta=modelSeoMetadata(row,lang);
  assert.match(meta.searchDescription,re,lang);
  assert.match(meta.description,re,lang);
  assert.ok(meta.searchDescription.length<=160,lang);
  for(const specs of [[{...base,verified_at:null}],[{...base,source_url:null}],[base,{...base,spec_id:"conflict",spec_value:"4"}],[{...base,measurement_standard:"Optional equipment"}],[{...base,rated_rpm:2200}],[{...base,unit:"cm3"}]]){
   assert.doesNotMatch(modelSeoMetadata({...row,specifications:specs},lang).searchDescription,re,lang);
  }
 }
 const tank={...base,canonical_key:"fuel_tank_capacity_l",spec_name:"Fuel tank",spec_value:"60"};
 assert.match(modelSeoMetadata({...row,specifications:[tank]},"tr").searchDescription,/60 L yakıt deposu/);
 assert.doesNotMatch(modelSeoMetadata({...row,specifications:[{...tank,canonical_key:"fuel_consumption_l_h"}]},"tr").searchDescription,/60 L yakıt deposu/);
 const independent={...base,source_type:"independent_catalog",source_publisher:"TractorData",source_url:"https://www.tractordata.com/farm-tractors/example.html"};
 assert.doesNotMatch(modelSeoMetadata({...row,specifications:[independent]},"en").searchDescription,/Manufacturer: 3 L/);
});


test("Valtra A75 A85 A95: ES and PT-BR nominal displacement descriptions are distinct and retain exact source identity",()=>{
 const base={...tractor.specifications[0],canonical_key:"engine_displacement_l",spec_name:"Engine displacement",spec_value:"3.3",unit:"l",measurement_standard:"Official brochure",source_publisher:"Valtra",source_url:"https://www.valtra.com/a-series.html",evidence_text:"Reviewed manufacturer displacement fixture"};
 for(const model_name of ["A75","A85","A95"]){
  const row={...tractor,brand_name:"Valtra",brand_website_url:"https://www.valtra.com/",model_name,variant:"A Series Gen5 Stage V / Gear lever, optional HiTech 2",market:"International (2025 brochure)",model_year:null,horsepower:null,specifications:[base]};
  const es=modelSeoMetadata(row,"es"),pt=modelSeoMetadata(row,"pt-br");
  assert.notEqual(es.searchDescription,pt.searchDescription);
  assert.match(pt.searchDescription,/cilindrada do motor de 3,3 L/);
  assert.match(es.searchDescription,/cilindrada de 3,3 L/);
  assert.doesNotMatch(modelSeoMetadata({...row,specifications:[{...base,source_url:null}]},"pt-br").searchDescription,/cilindrada do motor de 3,3 L/);
  for(const meta of [es,pt]){assert.ok(meta.searchDescription.includes("Valtra "+model_name));assert.ok(meta.searchDescription.includes("3,3 L"));assert.ok(meta.searchDescription.length<=160);}
 }
});


test("reviewed search-intent pilot adds only a real localized compare cue without dropping evidence",async()=>{
  const {addReviewedCompareSearchCue}=await import("../src/lib/model-seo.ts");
  const cases=[["tr","tafe-6028-m-9686ae98","Modelleri karşılaştırın."],["de","ls-tractor-j27-e424cd0c","Modelle vergleichen."],["hi","sonalika-125-812d14fd","मॉडल की तुलना करें।"],["en","swaraj-735-fe-7c7b069f","Compare models."],["pt-br","tafe-6028-m-9686ae98","Compare modelos."]];
  for(const [locale,slug,cue] of cases){
    const row={...tractor,slug};
    const evidence="Exact model. 114 HP.";
    assert.equal(addReviewedCompareSearchCue(evidence,row,locale),evidence+" "+cue);
    const boundary="x".repeat(160-cue.length-1);
    assert.equal(addReviewedCompareSearchCue(boundary,row,locale).length,160);
    assert.equal(addReviewedCompareSearchCue(boundary+"x",row,locale),boundary+"x");
    assert.equal(addReviewedCompareSearchCue(evidence,{...row,specifications:[]},locale),evidence);
    assert.equal(addReviewedCompareSearchCue(evidence,{...row,slug:"other-model"},locale),evidence);
    assert.equal(addReviewedCompareSearchCue(evidence+" "+cue,row,locale),evidence+" "+cue);
  }
  assert.equal(addReviewedCompareSearchCue("Exact model.",{...tractor,slug:"tafe-6028-m-9686ae98"},"ja"),"Exact model.");
  const row={...tractor,slug:"swaraj-735-fe-7c7b069f",variant:null,market:null,horsepower:null,specifications:[{...tractor.specifications[0],source_url:null}]};
  const original=modelSeoMetadata({...row,slug:"outside-pilot"},"en");
  const pilot=modelSeoMetadata(row,"en");
  assert.equal(pilot.title,original.title);
  assert.equal(pilot.description,original.description);
  assert.equal(pilot.searchDescription,original.searchDescription+" Compare models.");
  const detail=readFileSync(new URL("../src/components/TractorDetail.astro",import.meta.url),"utf8");
  assert.match(detail,/class="model-compare-action" href=\{compareUrl\}/);
});
