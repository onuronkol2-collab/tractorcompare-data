import type { TractorRecord } from "./catalog.ts";
import { officialManufacturerSourceUrl, specificationEvidenceLevel } from "./catalog.ts";
import { localizedPath, type Locale } from "./locales.ts";
import { t } from "./ui.ts";

/** The original manufacturer identity, equipment and market are never inferred. */
export function modelSeoMetadata(tractor: TractorRecord, lang: Locale) {
  const identity = [tractor.brand_name + " " + tractor.model_name, tractor.variant,
    tractor.market, tractor.model_year == null ? null : String(tractor.model_year)]
    .filter((part): part is string => Boolean(part && part.trim()));
  const title = identity.join(" | ") + " | " + t(lang, "modelSpecsTitle") + " | TractorVS";
  const descriptor = [
    tractor.horsepower == null ? null : t(lang, "power") + ": " + tractor.horsepower + " HP",
    tractor.specifications.length + " " + t(lang, "technicalSpecs"),
  ].filter(Boolean).join(" · ");
  const description = identity.join(" · ") + ". " + t(lang, "modelDesc") + " " + descriptor + ".";
  return { title, description };
}

/** Valid, sourced facts only. No invented prices, offers, ratings, or images. */
export function modelStructuredData(tractor: TractorRecord, lang: Locale, siteUrl: string) {
  const pageUrl = new URL(localizedPath(lang, "/tractors/" + tractor.slug + "/"), siteUrl).toString();
  const listUrl = new URL(localizedPath(lang, "/tractors/"), siteUrl).toString();
  const homeUrl = new URL(localizedPath(lang, "/"), siteUrl).toString();
  const name = tractor.brand_name + " " + tractor.model_name;
  const meta = modelSeoMetadata(tractor, lang);
  const propertySpecs = tractor.specifications.filter(
    (spec) => specificationEvidenceLevel(spec) === "manufacturer_documented"
      && spec.spec_value.trim() && spec.spec_name.trim()
  ).slice(0, 60);
  const sourceLinks = [...new Set(tractor.specifications.map((spec) =>
    officialManufacturerSourceUrl(spec, tractor.brand_name)
  ).filter((url): url is string => Boolean(url)))].slice(0, 12);
  const manufacturer: Record<string, unknown> = { "@type": "Organization", name: tractor.brand_name };
  if (tractor.brand_website_url) manufacturer.url = tractor.brand_website_url;
  const vehicle: Record<string, unknown> = {
    "@type": "Vehicle",
    "@id": pageUrl + "#tractor",
    name: name,
    url: pageUrl,
    model: tractor.model_name,
    manufacturer,
    description: meta.description,
  };
  if (tractor.variant) vehicle.vehicleConfiguration = tractor.variant;
  if (tractor.model_year != null) vehicle.vehicleModelDate = String(tractor.model_year);
  if (propertySpecs.length) vehicle.additionalProperty = propertySpecs.map((spec) => ({
    "@type": "PropertyValue",
    name: spec.spec_name,
    value: spec.spec_value,
    ...(spec.unit ? { unitText: spec.unit } : {}),
    ...(spec.measurement_standard ? { description: spec.measurement_standard } : {}),
  }));
  if (sourceLinks.length) vehicle.subjectOf = sourceLinks.map((url) => ({
    "@type": "CreativeWork", url,
  }));
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": pageUrl + "#webpage",
        url: pageUrl,
        name: meta.title,
        description: meta.description,
        inLanguage: lang === "zh" ? "zh-Hans" : lang === "pt-br" ? "pt-BR" : lang,
        mainEntity: { "@id": pageUrl + "#tractor" },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "TractorVS", item: homeUrl },
          { "@type": "ListItem", position: 2, name: t(lang, "allTractors"), item: listUrl },
          { "@type": "ListItem", position: 3, name, item: pageUrl },
        ],
      },
      vehicle,
    ],
  };
}
