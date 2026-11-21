import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {LOCALES} from "../src/lib/locales.ts";
import {publishedSpecificationLabel, PUBLISHED_SPEC_TERMS, validatePublishedSpecTranslations} from "../src/lib/published-spec-translations.ts";
import {specLabel} from "../src/lib/catalog.ts";
import {localizedSpecificationName} from "../src/lib/spec-i18n.ts";

const missing=JSON.parse(readFileSync(new URL("./fixtures/published-technical-fallbacks.json",import.meta.url),"utf8"));

test("all measured published technical fallbacks have actual translations",()=>{
  assert.doesNotThrow(validatePublishedSpecTranslations);
  assert.equal(LOCALES.length,10);
  for(const [locale,terms] of Object.entries(missing)){
    assert.ok(LOCALES.includes(locale),"unknown locale "+locale);
    for(const english of terms){
      const actual=publishedSpecificationLabel(english,locale);
      assert.ok(actual && actual.trim() && actual.toLowerCase()!==english.toLowerCase(),locale+" "+english);
      const spec={canonical_key:"not-mapped-yet",spec_name:english};
      assert.equal(specLabel(spec,locale),actual,"display resolution "+locale+" "+english);
    }
  }
});
test("source text, numbers and unsupported keys are not translated into invented data",()=>{
  assert.equal(publishedSpecificationLabel("model-specific unknown measured spec","tr"),null);
  assert.equal(publishedSpecificationLabel("Nominal rated power, ISO 14396","en"),null);
  const fallback=specLabel({canonical_key:"unknown",spec_name:"Unknown manufacturer field"},"tr");
  assert.equal(fallback,"Unknown Manufacturer Field");
});
test("published dictionary covers 62 audited distinct English technical headings",()=>{
  const required=new Set(Object.values(missing).flat());
  assert.equal(required.size,62);
  for(const name of required)assert.ok(PUBLISHED_SPEC_TERMS[name],name);
});

test("German engine aspiration describes intake method without implying forced induction",()=>{
  const value=localizedSpecificationName("engine_aspiration","Aspiration","de");
  assert.equal(value,"Ansaugart des Motors");
  assert.notEqual(value,"Motoraufladung");
  const source={canonical_key:"engine_aspiration",spec_name:"Engine aspiration"};
  assert.equal(specLabel(source,"de"),value);
});

test("general engine torque is not mislabeled maximum torque in eight locales",()=>{
  const expected={
    zh:"发动机扭矩",hi:"इंजन टॉर्क","pt-br":"Torque do motor",
    fr:"Couple moteur",de:"Motordrehmoment",ru:"Крутящий момент двигателя",
    ja:"エンジントルク",es:"Par motor"
  };
  for(const [locale,label] of Object.entries(expected)){
    assert.equal(localizedSpecificationName("engine_torque","Engine torque",locale),label);
    assert.equal(specLabel({canonical_key:"engine_torque",spec_name:"Engine torque"},locale),label);
  }
  assert.notEqual(
    localizedSpecificationName("engine_torque","Engine torque","zh"),
    localizedSpecificationName("engine_torque_rpm","Engine torque RPM","zh"),
    "General torque and the RPM of maximum torque must not collapse"
  );
  assert.notEqual(
    localizedSpecificationName("engine_torque","Engine torque","de"),
    localizedSpecificationName("engine_torque_with_epm","Engine torque with EPM","de")
  );
});

test("generic engine torque is never falsely labeled maximum in English or Turkish",()=>{
  const generic={canonical_key:"engine_torque",spec_name:"Engine torque"};
  const maxRPM={canonical_key:"engine_torque_rpm",spec_name:"Engine speed at maximum torque"};
  assert.equal(specLabel(generic,"en"),"Engine torque");
  assert.equal(specLabel(generic,"tr"),"Motor torku");
  assert.equal(specLabel(maxRPM,"en"),"Engine speed at maximum torque");
  assert.equal(specLabel(maxRPM,"tr"),"Azami torkta motor devri");
  for(const lang of LOCALES)assert.doesNotMatch(specLabel(generic,lang),/^maximum torque$|^azami tork$/i);
});

test("ten locales distinguish manufacturer marketing HP categories, unrated power and unscoped weights",()=>{
  const keys=[
    ["engine_hp_category","Manufacturer horsepower category (not measured engine power)"],
    ["manufacturer_engine_power_unspecified_standard","Manufacturer-stated engine power (test standard not stated)"],
    ["manufacturer_max_pto_power_unspecified_standard","Manufacturer-stated maximum PTO power (test standard not stated)"],
    ["manufacturer_f25_rops_weight_unscoped","F25 weight with ROPS (gearbox variant unspecified)"],
    ["weight_unspecified","Weight (load condition unspecified)"],
    ["transmission_configuration","Transmission configuration"]
  ];
  for(const [key,english] of keys){
    for(const locale of LOCALES){
      const actual=specLabel({canonical_key:key,spec_name:english},locale);
      assert.ok(actual && actual.trim().length>3,locale+" missing "+key);
      if(locale!=="en")assert.notEqual(actual.toLowerCase(),english.toLowerCase(),locale+" fallback "+key);
    }
  }
  for(const locale of LOCALES){
    const category=specLabel({canonical_key:"engine_hp_category",spec_name:"Manufacturer horsepower category"},locale);
    const rated=specLabel({canonical_key:"engine_rated_power",spec_name:"Rated engine power"},locale);
    const stated=specLabel({canonical_key:"manufacturer_engine_power_unspecified_standard",spec_name:"Manufacturer-stated engine power"},locale);
    const maxPto=specLabel({canonical_key:"manufacturer_max_pto_power_unspecified_standard",spec_name:"Maximum PTO power"},locale);
    assert.notEqual(category,rated,"HP category is not verified rated power: "+locale);
    assert.notEqual(stated,rated,"Unstandardized claimed engine power is not rated power: "+locale);
    assert.notEqual(maxPto,stated,"PTO is not engine power: "+locale);
  }
});


test("all seven released marketing and ECE power evidence labels are localized in ten languages",()=>{
  const sourceNames=["Manufacturer power class (not rated engine output)","Maximum manufacturer engine power","Manufacturer power category (not rated engine HP)","Maximum ECE R120 power (rounded, HP)","Manufacturer power class (not exact rated HP)","Series advertised maximum (rounded; not model-specific)","YT3 marketing maximum power class (HP)"];
  for(const name of sourceNames){
    assert.ok(PUBLISHED_SPEC_TERMS[name],"missing exact source label "+name);
    assert.equal(publishedSpecificationLabel(name,"en"),null,"English already authoritative");
    for(const locale of LOCALES){
      const actual=specLabel({canonical_key:null,spec_name:name},locale);
      assert.ok(actual?.trim(),locale+" empty "+name);
      if(locale!=="en"){
        const translated=publishedSpecificationLabel(name,locale);
        assert.equal(actual,translated,locale+" fallback mismatch for "+name);
        assert.notEqual(actual.toLowerCase(),name.toLowerCase(),locale+" left English fallback");
      }
    }
  }
  for(const locale of LOCALES){
    const series=specLabel({canonical_key:null,spec_name:"Series advertised maximum (rounded; not model-specific)"},locale);
    const standard=specLabel({canonical_key:null,spec_name:"Maximum ECE R120 power (rounded, HP)"},locale);
    const generic=specLabel({canonical_key:null,spec_name:"Maximum manufacturer engine power"},locale);
    assert.notEqual(series,standard,"series-wide marketing is not ECE R120: "+locale);
    assert.notEqual(series,generic,"series-wide claim is not exact OEM model power: "+locale);
    assert.ok(standard.includes("ECE R120"),"ECE standard must be retained: "+locale);
  }
  assert.doesNotThrow(validatePublishedSpecTranslations);
});


test("frequent published canonical fields have correctly scoped labels in all ten locales",()=>{
  const keys=["engine_max_torque","service_interval_hours","engine_boost_power_hp","engine_boost_power_kw","engine_boost_max_torque","fuel_tank_capacity_basic","fuel_tank_capacity_steel_tank","maximum_permitted_mass","ground_clearance_rear","ground_clearance_mid","rear_tire_options","front_tire_options","engine_type","overall_width_max","operating_weight","transmission_reverser","front_axle_suspension","transmission_gears","drive_system","tractor_weight","front_track","rear_track","air_conditioning","rear_hydraulic_remotes","engine_aftertreatment"];
  for(const key of keys){
    const source={canonical_key:key,spec_name:key.replaceAll("_"," ")};
    const english=specLabel(source,"en");
    const turkish=specLabel(source,"tr");
    assert.ok(english.length>=7,key+" lacks English");
    assert.ok(turkish.length>=5,key+" lacks Turkish");
    assert.notEqual(turkish.toLowerCase(),english.toLowerCase(),"Turkish English fallback "+key);
    for(const lang of LOCALES){
      const value=specLabel(source,lang);
      // A fully correct CJK label may use two characters (e.g. Chinese 空调, air conditioning).
      const minLength=(lang==="zh"||lang==="ja")?2:3;
      assert.ok(value && value.trim().length>=minLength,lang+" missing "+key);
      if(lang!=="en")assert.notEqual(value.toLowerCase(),english.toLowerCase(),lang+" English fallback "+key);
    }
  }
});

test("power, torque, load status, gear ratios, 2WD/4WD and tyre options do not collapse semantically",()=>{
  const label=(k,lang)=>specLabel({canonical_key:k,spec_name:k.replaceAll("_"," ")},lang);
  for(const locale of LOCALES){
    assert.notEqual(label("engine_max_torque",locale),label("engine_torque",locale),locale+" max torque vs generic torque");
    assert.notEqual(label("engine_max_torque",locale),label("engine_boost_max_torque",locale),locale+" boost torque");
    assert.notEqual(label("engine_boost_power_hp",locale),label("engine_boost_power_kw",locale),locale+" boost power units");
    assert.notEqual(label("maximum_permitted_mass",locale),label("operating_weight",locale),locale+" permitted mass versus weight");
    assert.notEqual(label("front_tire_options",locale),label("front_tire_size",locale),locale+" options vs fitted tire");
    assert.notEqual(label("rear_tire_options",locale),label("rear_tire_size",locale),locale+" options vs fitted tire");
    assert.notEqual(label("ground_clearance_rear",locale),label("ground_clearance_mid",locale),locale+" clearance location");
  }
  assert.equal(label("drive_configuration","en"),"Drivetrain configuration (2WD/4WD)");
  assert.equal(label("drive_configuration","tr"),"Çekiş düzeni (2WD/4WD)");
  assert.equal(label("engine_max_torque_nm","tr"),label("engine_max_torque","tr"),"unit variant not different torque concept");
  assert.equal(label("engine_displacement_cc","tr"),label("engine_displacement","tr"));
  assert.equal(label("rear_pto_speeds","ja"),label("pto_speeds","ja"));
  assert.equal(label("adblue_capacity","pt-br"),label("adblue_tank_capacity","pt-br"));
});

test("engine power labels retain the recorded standard and boost condition in every locale",async()=>{
 const {localizedSpecificationName}=await import("../src/lib/spec-i18n.ts");
 for(const lang of ["en","tr","zh","hi","pt-br","fr","de","ru","ja","es"]){
  const standard=localizedSpecificationName("engine_max_power_kw","Maximum engine power ISO TR 14396",lang);
  const unboosted=localizedSpecificationName("engine_max_power_kw","Maximum engine power without boost",lang);
  assert.match(standard,/14396/);
  assert.ok(unboosted);
  assert.notEqual(standard,unboosted);
  if(lang!=="en")assert.notEqual(unboosted,"Maximum engine power without boost");
 }
});
