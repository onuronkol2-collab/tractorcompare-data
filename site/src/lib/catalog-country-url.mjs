/**
 * Preserve an explicit catalogue pricing-country selection across the ten
 * language choices. No cookie, storage, tracking, server request or index URL.
 * The page's SEO canonical stays on its clean catalogue route.
 */
export function countryAwareCatalogUrl(href,country,allowedCountries){
 if(typeof href!=="string"||!href.trim()||
  typeof country!=="string"||!Array.isArray(allowedCountries)||
  !allowedCountries.includes(country))
  throw Error("Unsupported catalogue country selection");
 const url=new URL(href);
 url.searchParams.set("country",country);
 return url.pathname+url.search+url.hash;
}
