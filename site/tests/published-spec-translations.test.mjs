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
