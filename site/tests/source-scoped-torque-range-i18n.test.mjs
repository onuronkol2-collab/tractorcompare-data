import assert from "node:assert/strict";
import test from "node:test";
import { LOCALES } from "../src/lib/locales.ts";
import { specLabel } from "../src/lib/catalog.ts";
import { localizedSpecificationName, validateTechnicalGlossary } from "../src/lib/spec-i18n.ts";
import { publishedSpecificationLabel, validatePublishedSpecTranslations } from "../src/lib/published-spec-translations.ts";

const rangeKey = "manufacturer_engine_torque_range_at_rpm";
const rangeSourceName = "Manufacturer quoted torque RANGE (83-100 Nm at 1650 rpm; not a unique maximum)";
const advertisedCvSourceName = "Manufacturer advertised metric power (cv; test standard not independently established by the product page)";

test("new source-scoped range is explicitly localized in all ten languages", () => {
  assert.doesNotThrow(validateTechnicalGlossary);
  assert.equal(LOCALES.length, 10);
  const fixture = {
    canonical_key: rangeKey,
    spec_name: rangeSourceName,
    spec_value: "83–100",
    unit: "Nm",
    measurement_standard: "Manufacturer quoted range at 1650 rpm, not a single peak torque"
  };
  const expected = {
    en: "Manufacturer-stated engine torque range (at stated RPM; not a single maximum)",
    tr: "Üreticinin belirttiği motor tork aralığı (verilen devirde; tek bir azami değer değil)",
    zh: "制造商公布的发动机扭矩范围（注明转速）",
    hi: "निर्माता द्वारा बताई गई इंजन टॉर्क सीमा (निर्दिष्ट आरपीएम पर)",
    "pt-br": "Faixa de torque do motor declarada pelo fabricante (na rotação indicada)",
    fr: "Plage de couple moteur annoncée par le constructeur (au régime indiqué)",
    de: "Vom Hersteller angegebener Motordrehmomentbereich (bei genannter Drehzahl)",
    ru: "Диапазон крутящего момента двигателя по данным производителя (при указанных оборотах)",
    ja: "メーカー公表のエンジントルク範囲（指定回転数時）",
    es: "Rango de par motor declarado por el fabricante (al régimen indicado)"
  };
  assert.deepEqual([...LOCALES].sort(), Object.keys(expected).sort());
  for (const lang of LOCALES) {
    assert.equal(specLabel(fixture, lang), expected[lang], "range engineering label: " + lang);
    assert.notEqual(
      specLabel(fixture,lang),
      specLabel({canonical_key:"engine_torque",spec_name:"Engine torque"},lang),
      "A manufacturer torque range must not silently become scalar engine torque: " + lang
    );
    assert.notEqual(
      specLabel(fixture,lang),
      specLabel({canonical_key:"engine_max_torque",spec_name:"Maximum torque"},lang),
      "A manufacturer torque range must not become unique maximum torque: " + lang
    );
    if(lang !== "en" && lang !== "tr"){
      assert.equal(localizedSpecificationName(rangeKey,rangeSourceName,lang),expected[lang]);
    }
  }
  assert.equal(fixture.spec_value, "83–100");
  assert.equal(fixture.unit, "Nm");
  assert.equal(fixture.measurement_standard, "Manufacturer quoted range at 1650 rpm, not a single peak torque");
});

test("short Agrale product-page advertised cv is not falsely labeled a tested engine rating in any locale", () => {
  assert.doesNotThrow(validatePublishedSpecTranslations);
  const input = {canonical_key:"engine_power_metric",spec_name:advertisedCvSourceName,spec_value:"75",unit:"cv"};
  for (const locale of LOCALES) {
    const label = specLabel(input,locale);
    assert.ok(label.trim().length > 12,locale);
    if(locale === "en"){
      assert.equal(label,advertisedCvSourceName);
      assert.equal(publishedSpecificationLabel(advertisedCvSourceName,locale),null);
    } else {
      assert.equal(label,publishedSpecificationLabel(advertisedCvSourceName,locale),locale);
      assert.notEqual(label.toLowerCase(),advertisedCvSourceName.toLowerCase());
    }
    assert.notEqual(label,specLabel({canonical_key:"engine_rated_power",spec_name:"Rated engine power"},locale),
      "Unstandardized marketing cv is not a test-certified rated engine power: " + locale);
  }
  assert.equal(input.spec_value,"75");
  assert.equal(input.unit,"cv");
});
