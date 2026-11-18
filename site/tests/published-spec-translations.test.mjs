import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {LOCALES} from "../src/lib/locales.ts";
import {publishedSpecificationLabel, PUBLISHED_SPEC_TERMS, validatePublishedSpecTranslations} from "../src/lib/published-spec-translations.ts";
import {specLabel} from "../src/lib/catalog.ts";

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
  assert.equal(fallback,"Unknown manufacturer field");
});
test("published dictionary covers 60 audited distinct English technical headings",()=>{
  const required=new Set(Object.values(missing).flat());
  assert.equal(required.size,60);
  for(const name of required)assert.ok(PUBLISHED_SPEC_TERMS[name],name);
});
