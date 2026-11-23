import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {RESIDUAL_PUBLIC_SPEC_TERMS} from "../src/lib/residual-public-spec-translations.ts";
import {publishedSpecificationLabel,validatePublishedSpecTranslations} from "../src/lib/published-spec-translations.ts";
import {specLabel} from "../src/lib/catalog.ts";
import {LOCALES} from "../src/lib/locales.ts";

const baseline=JSON.parse(readFileSync(new URL("./fixtures/turkish-public-heading-residual-20261121.json",import.meta.url),"utf8"));
const exampleSpec=name=>({canonical_key:"unmapped_technical_source_heading",spec_name:name,spec_value:"25",unit:"hp",measurement_standard:"NBR ISO 1585",verified_at:"2026-11-21T15:15:00Z",source_url:"https://example.org/sheet.pdf",evidence_text:"Verified source excerpt"});

test("all 80 Turkish fallback headings from the 379-model audit now resolve to reviewed Turkish",()=>{
  assert.equal(LOCALES.length,10);
  assert.equal(baseline.distinctHeadings,80);
  assert.equal(baseline.occurrences,101);
  assert.equal(baseline.terms.reduce((total,x)=>total+x.count,0),101);
  assert.doesNotThrow(validatePublishedSpecTranslations);
  const before=new Set();
  for(const {english,exampleSlugs} of baseline.terms){
    assert.ok(!before.has(english),english+" duplicated");
    before.add(english);
    assert.ok(exampleSlugs.length>=1,english+" has no public slug");
    const translated=publishedSpecificationLabel(english,"tr");
    assert.ok(translated?.trim(),english+" missing Turkish display term");
    assert.notEqual(translated.toLocaleLowerCase("tr"),english.toLocaleLowerCase("tr"),english+" unchanged");
    const spec=exampleSpec(english),orig=structuredClone(spec);
    assert.equal(specLabel(spec,"tr"),translated,english+" overridden by an unsafe generic fallback");
    assert.deepEqual(spec,orig,english+" mutated the source record");
  }
  assert.equal(before.size,80);
});

test("technical qualifiers are kept distinct in the inspected Turkish headings",()=>{
  const tr=n=>publishedSpecificationLabel(n,"tr");
  assert.notEqual(tr("Manufacturer Rated Power"),tr("Manufacturer Stated Power"));
  assert.notEqual(tr("Operating Weight Without Ballast"),tr("Operating Weight (Brochure Configuration)"));
  assert.notEqual(tr("Speed Range Forward"),tr("Speed Range Reverse"));
  assert.notEqual(tr("Front Diff Lock Type"),tr("Rear Diff Lock Type"));
  assert.match(tr("Maximum Speed (Brochure, Tyre-Dependent) - Mechanical"),/lastiğe bağlı/i);
  assert.match(tr("Maximum Speed (Brochure, Tyre-Dependent) - Powershuttle"),/PowerShuttle/);
  assert.match(tr("Manufacturer Engine Power (Metric Hp)"),/metrik bg/);
  assert.match(tr("F36CHN HST Transmission Ranges"),/F36CHN HST/);
});

test("reviewed additions remain explicit locale pairs, without generic/AI source-value translation",()=>{
  let added=0;
  for(const [english,entries] of Object.entries(RESIDUAL_PUBLIC_SPEC_TERMS)){
    for(const [locale,translated] of Object.entries(entries)){
      added++;
      assert.ok(LOCALES.includes(locale)&&locale!=="en",english+" unsupported locale");
      assert.ok(translated.trim(),english+" "+locale+" missing");
      assert.notEqual(translated.trim().toLocaleLowerCase(locale),english.trim().toLocaleLowerCase(locale),english+" "+locale+" unchanged");
    }
  }
  assert.ok(added>=450,"audit should include selected frequent PT/FR/ES/ZH/HI/DE/RU/JA gaps");
  assert.equal(publishedSpecificationLabel("Unknown manufacturer text that nobody verified","tr"),null);
  assert.equal(publishedSpecificationLabel("Manufacturer Rated Power","en"),null);
});

test("nine translated locales preserve power standard and 2WD/4WD conditions",()=>{
  for(const locale of LOCALES.filter(x=>x!=="en")){
    const p=name=>specLabel(exampleSpec(name),locale);
    const maxKW=p("Azami Motor GüCü (ECE R120, KW)");
    const maxCV=p("Azami Motor GüCü (ECE R120, CV)");
    const nominalKW=p("Nominal Motor GüCü (ECE R120, KW)");
    assert.match(maxKW,/ECE R120/i);
    assert.match(maxCV,/ECE R120/i);
    assert.match(nominalKW,/ECE R120/i);
    assert.notEqual(maxKW,maxCV,locale+" cannot conflate kW and cv");
    assert.notEqual(maxKW,nominalKW,locale+" cannot conflate maximum and nominal");
  }
  for(const locale of ["tr","pt-br","fr","es"]){
    const a=specLabel(exampleSpec("Max Speed 4wd Kmh"),locale);
    const b=specLabel(exampleSpec("Min Speed 4wd Kmh"),locale);
    assert.notEqual(a,b,locale+" minimum vs maximum");
    assert.match(a,/4WD|4RM/i,locale+" lost 4WD condition");
  }
});

test("previously reviewed EPM and ISO standard translations are not overridden",()=>{
  for(const locale of LOCALES.filter(x=>x!=="en")){
    const epm=publishedSpecificationLabel("Maximum Engine Power With EPM",locale);
    assert.ok(epm?.includes("EPM"),locale+" EPM lost");
    const iso=publishedSpecificationLabel("Maximum engine power ISO TR 14396",locale);
    assert.ok(iso?.includes("14396"),locale+" ISO lost");
  }
});

test("last audited Chinese and Russian labels are exact, source-scoped and no longer English",()=>{
  assert.equal(publishedSpecificationLabel("Motor soğutma tipi","zh"),"发动机冷却方式");
  assert.equal(publishedSpecificationLabel("Operator station / cab","ru"),"Рабочее место оператора / кабина");
  assert.equal(specLabel({...exampleSpec("Motor soğutma tipi"),canonical_key:"engine_cooling"},"zh"),"发动机冷却方式");
  assert.equal(specLabel({...exampleSpec("Operator station / cab"),canonical_key:"cab_type"},"ru"),"Рабочее место оператора / кабина");
});


test("source-specific PT-BR, French and Spanish technical headings retain exact meaning",()=>{
  const reviewed={
    "Clutch Configuration":["Configuração da embreagem","Configuration de l’embrayage","Configuración del embrague"],
    "Creeper Gearbox Option":["Opção de caixa de velocidades super-redutora","Option de boîte de vitesses à rapports rampants","Opción de caja de cambios superreductora"],
    "Driven Wheels":["Rodas motrizes","Roues motrices","Ruedas motrices"],
    "Engine Maker":["Fabricante do motor","Fabricant du moteur","Fabricante del motor"],
    "Forward/Reverse Gear Options":["Opções de marchas à frente e à ré","Options de rapports avant et arrière","Opciones de marchas de avance y retroceso"],
    "Gear Count":["Número de marchas","Nombre de rapports","Número de marchas"],
    "Rear Remote Valve Sets":["Conjuntos de distribuidores hidráulicos traseiros","Ensembles de distributeurs hydrauliques arrière","Conjuntos de distribuidores hidráulicos traseros"],
    "Standard Front Tire Size":["Dimensão padrão do pneu dianteiro","Dimension standard du pneu avant","Medida estándar del neumático delantero"],
    "Standard Rear Tire Size":["Dimensão padrão do pneu traseiro","Dimension standard du pneu arrière","Medida estándar del neumático trasero"],
    "Transmission Gears":["Marchas da transmissão","Rapports de transmission","Marchas de la transmisión"],
    "Transmission Shuttle Type":["Tipo de inversor de marcha da transmissão","Type d’inverseur de marche de la transmission","Tipo de inversor de marcha de la transmisión"],
  };
  const locales=["pt-br","fr","es"];
  assert.equal(Object.keys(reviewed).length,11);
  for(const [source,values] of Object.entries(reviewed)){
    assert.equal(values.length,3);
    for(let i=0;i<locales.length;i++){
      const locale=locales[i];
      const spec=exampleSpec(source);
      const untouched=structuredClone(spec);
      assert.equal(publishedSpecificationLabel(source,locale),values[i],source+" "+locale);
      assert.equal(specLabel(spec,locale),values[i],source+" "+locale);
      assert.deepEqual(spec,untouched,"source measurements and evidence never change");
    }
  }
  for(const locale of locales){
    assert.notEqual(
      publishedSpecificationLabel("Standard Front Tire Size",locale),
      publishedSpecificationLabel("Standard Rear Tire Size",locale),
      locale+" front and rear variants must remain distinguishable"
    );
    assert.match(publishedSpecificationLabel("Four-Wheel-Drive Engagement",locale),/4WD|4RM/,
      locale+" drivetrain qualification must not disappear");
    assert.notEqual(
      publishedSpecificationLabel("Max Speed",locale),
      publishedSpecificationLabel("Minimum Forward Speed",locale),
      locale+" minimum and maximum speed cannot be conflated");
  }
});


test("live 388-model Turkish predeploy audit exact source headings have safe translations",()=>{
  const cases={
    "4WD Engagement Control":"4WD devreye alma kumandası",
    "Forward/Reverse Shuttle Control":"İleri/geri yön değiştirme kumandası",
    "Front Differential Lock / Limited Slip":"Ön diferansiyel kilidi / sınırlı kaymalı diferansiyel",
    "Rear Differential Lock Actuation":"Arka diferansiyel kilidini devreye alma kumandası"
  };
  assert.equal(Object.keys(cases).length,4);
  for(const [source,label] of Object.entries(cases)){
    const spec=exampleSpec(source),original=structuredClone(spec);
    assert.equal(publishedSpecificationLabel(source,"tr"),label,source);
    assert.equal(specLabel(spec,"tr"),label,source);
    assert.deepEqual(spec,original,source+" must never mutate source evidence");
  }
  assert.match(publishedSpecificationLabel("4WD Engagement Control","tr"),/4WD/);
  assert.match(publishedSpecificationLabel("Front Differential Lock / Limited Slip","tr"),/sınırlı kaymalı/);
});


test("twelve frequent verified source headings have distinct, native PT-BR / FR / ES display text",()=>{
  // The keyed 388x10 build report dated 22-Nov-2026 ties these source names
  // to published technical spec identities. No power/pressure/hitch values
  // or underlying manufacturer claims may be rewritten.
  const sourceToLocales={
    "Hydraulic System Capacity":["Capacidade do sistema hidráulico","Capacité du système hydraulique","Capacidad del sistema hidráulico"],
    "Rear Hitch Control":["Controle do engate traseiro","Commande de l’attelage arrière","Control del enganche trasero"],
    "Lift Capacity At Suspension Point":["Capacidade de elevação no ponto de suspensão","Capacité de relevage au point de suspension","Capacidad de elevación en el punto de suspensión"],
    "Engine Max/Rated Power ECE R120":["Potência máxima/nominal do motor (ECE R120)","Puissance moteur maximale/nominale (ECE R120)","Potencia máxima/nominal del motor (ECE R120)"],
    "Engine Max/Rated Power ECE R120 (Hp)":["Potência máxima/nominal do motor (ECE R120, hp)","Puissance moteur maximale/nominale (ECE R120, hp)","Potencia máxima/nominal del motor (ECE R120, hp)"],
    "Hydraulic Remote Control":["Controle hidráulico remoto","Commande hydraulique à distance","Control hidráulico remoto"],
    "Lifting Force Across Full Range":["Força de elevação ao longo de toda a faixa","Force de relevage sur toute la plage","Fuerza de elevación en todo el rango"],
    "Maximum Hitch Lifting Force":["Força máxima de elevação do engate","Force de relevage maximale de l’attelage","Fuerza máxima de elevación del enganche"],
    "Engine Cylinders":["Cilindros do motor","Cylindres du moteur","Cilindros del motor"],
    "Rated Engine Speed":["Rotação nominal do motor","Régime nominal du moteur","Régimen nominal del motor"],
    "Hydraulic Working Pressure":["Pressão de trabalho do sistema hidráulico","Pression de service hydraulique","Presión de trabajo del sistema hidráulico"],
    "Maximum Hydraulic Operating Pressure":["Pressão hidráulica máxima de operação","Pression hydraulique maximale de service","Presión hidráulica máxima de funcionamiento"],
  };
  assert.equal(Object.keys(sourceToLocales).length,12);
  const locales=["pt-br","fr","es"];
  for(const [source,translations] of Object.entries(sourceToLocales)){
    for(let i=0;i<locales.length;i++){
      const locale=locales[i],original=exampleSpec(source),before=structuredClone(original);
      assert.equal(publishedSpecificationLabel(source,locale),translations[i],source+" "+locale);
      assert.equal(specLabel(original,locale),translations[i],"actual published label must use reviewed source text");
      assert.deepEqual(original,before,"never alter source measurement, provenance or unit");
    }
  }
  for(const locale of locales){
    const translated=k=>publishedSpecificationLabel(k,locale);
    assert.match(translated("Engine Max/Rated Power ECE R120"),/ECE R120/);
    assert.match(translated("Engine Max/Rated Power ECE R120 (Hp)"),/ECE R120/);
    assert.notEqual(translated("Engine Max/Rated Power ECE R120"),translated("Engine Max/Rated Power ECE R120 (Hp)"));
    assert.notEqual(translated("Lift Capacity At Suspension Point"),translated("Maximum Hitch Lifting Force"));
    assert.notEqual(translated("Hydraulic Working Pressure"),translated("Maximum Hydraulic Operating Pressure"));
  }
});

test("ArmaTrac 804 source-specific weight labels preserve cab versus ROPS and no-ballast meaning in ten locales",()=>{
  const cabName="Weight with cab, without extra ballast";
  const ropsName="Weight without ballast (ROPS)";
  for(const locale of LOCALES.filter(x=>x!=="en")){
    const cab=publishedSpecificationLabel(cabName,locale);
    const rops=publishedSpecificationLabel(ropsName,locale);
    assert.ok(cab&&rops,locale+" exact weight headings missing");
    assert.notEqual(cab,rops,locale+" cab/ROPS distinction lost");
    assert.equal(specLabel({...exampleSpec(cabName),canonical_key:"operating_weight_cab"},locale),cab);
    assert.equal(specLabel({...exampleSpec(ropsName),canonical_key:"operating_weight"},locale),rops);
    assert.match(rops,/ROPS/i,locale+" ROPS qualifier erased");
  }
  assert.equal(specLabel({...exampleSpec(cabName),canonical_key:"operating_weight_cab"},"en"),cabName);
  assert.equal(specLabel({...exampleSpec(ropsName),canonical_key:"operating_weight"},"en"),ropsName);
  assert.doesNotThrow(validatePublishedSpecTranslations);
});
