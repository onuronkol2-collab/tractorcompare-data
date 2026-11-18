import type { TractorRecord } from "./catalog.ts";
import { officialManufacturerSourceUrl } from "./catalog.ts";
import { localizedPath, type Locale } from "./locales.ts";
import { t } from "./ui.ts";
import {primaryTractorPhoto,tractorPhotoAlt} from "./tractor-photos.ts";

/** The original manufacturer identity, equipment and market are never inferred. */
export function modelSeoMetadata(tractor: TractorRecord, lang: Locale) {
  const model = tractor.brand_name + " " + tractor.model_name;
  // A catalogue source/caveat following a semicolon is useful in the page,
  // but not a readable search title. The full identity stays in description.
  const variantLabel = tractor.variant?.split(";")[0]?.trim() || null;
  const marketLabel = tractor.market?.trim().toLowerCase() === "global" ? null : tractor.market?.trim() || null;
  const titleQualifiers = [
    variantLabel && variantLabel.length <= 48 ? variantLabel : null,
    marketLabel,
    tractor.model_year == null ? null : String(tractor.model_year),
  ].filter((part): part is string => Boolean(part));
  const title = model + " " + t(lang, "modelSpecsTitle")
    + (titleQualifiers.length ? " — " + titleQualifiers.join(" · ") : "")
    + " | TractorVS";
  const identity = [model, tractor.variant, tractor.market,
    tractor.model_year == null ? null : String(tractor.model_year)]
    .filter((part): part is string => Boolean(part && part.trim()));
  const descriptor = [
    tractor.horsepower == null ? null : t(lang, "power") + ": " + tractor.horsepower + " HP",
    tractor.specifications.length + " " + t(lang, "technicalSpecs"),
  ].filter(Boolean).join(" · ");
  const description = identity.join(" · ") + ". " + t(lang, "modelDesc") + " " + descriptor + ".";
  return { title, description };
}

/**
 * TractorVS is an independent specifications catalogue, not a seller.
 *
 * Vehicle is a subclass of schema.org/Product, so Google asks for an Offer,
 * Review or AggregateRating on every model page even though the site does
 * not collect verified offers or ratings. Do not invent those claims.
 *
 * Keep the indexed WebPage, its breadcrumbs, a stable identity for the
 * documented tractor, and links to actual manufacturer evidence. The
 * manufacturer-backed specification values remain visible in the HTML
 * comparison cards, without claiming Product rich-result eligibility.
 */
export function modelStructuredData(tractor: TractorRecord, lang: Locale, siteUrl: string) {
  const pageUrl = new URL(localizedPath(lang, "/tractors/" + tractor.slug + "/"), siteUrl).toString();
  const listUrl = new URL(localizedPath(lang, "/tractors/"), siteUrl).toString();
  const homeUrl = new URL(localizedPath(lang, "/"), siteUrl).toString();
  const name = tractor.brand_name + " " + tractor.model_name;
  const meta = modelSeoMetadata(tractor, lang);
  const sourceLinks = [...new Set(tractor.specifications.map((spec) =>
    officialManufacturerSourceUrl(spec, tractor.brand_name)
  ).filter((url): url is string => Boolean(url)))].slice(0, 12);

  const subject: Record<string, unknown> = {
    "@type": "Thing",
    "@id": pageUrl + "#tractor",
    name,
    url: pageUrl,
    identifier: tractor.tractor_id,
    description: meta.description,
  };
  const identityContext = [tractor.variant, tractor.market, tractor.model_year]
    .filter((part) => part !== null && part !== undefined && String(part).trim())
    .map(String);
  if (identityContext.length) subject.disambiguatingDescription = identityContext.join(" · ");
  const image=primaryTractorPhoto(tractor);
  if(image) subject.image = { "@id":pageUrl+"#photo" };
  if (sourceLinks.length) subject.subjectOf = sourceLinks.map((url) => ({
    "@type": "CreativeWork", url,
  }));

  const graph:Record<string,unknown>[] = [
      {
        "@type": "WebPage",
        "@id": pageUrl + "#webpage",
        url: pageUrl,
        name: meta.title,
        description: meta.description,
        inLanguage: lang === "zh" ? "zh-Hans" : lang === "pt-br" ? "pt-BR" : lang,
        mainEntity: { "@id": pageUrl + "#tractor" },
        about: { "@id": pageUrl + "#tractor" },
        ...(image ? { primaryImageOfPage: { "@id":pageUrl+"#photo" } } : {}),
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "TractorVS", item: homeUrl },
          { "@type": "ListItem", position: 2, name: t(lang, "allTractors"), item: listUrl },
          { "@type": "ListItem", position: 3, name, item: pageUrl },
        ],
      },
      subject,
  ];
  if(image)graph.push({
    "@type":"ImageObject",
    "@id":pageUrl+"#photo",
    contentUrl:new URL(image.fullUrl,siteUrl).toString(),
    thumbnailUrl:new URL(image.displayUrl,siteUrl).toString(),
    caption:tractorPhotoAlt(tractor,lang),
    creator:{"@type":"Person",name:image.photographer},
    copyrightNotice:"© "+image.photographer,
    creditText:image.photographer+" · "+image.licenseName,
    license:image.licenseUrl,
    url:image.sourcePage,
  });
  return {"@context":"https://schema.org","@graph":graph};
}
