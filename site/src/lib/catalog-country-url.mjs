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
 // Only the ten canonical catalogue paths may be returned as navigation URLs.
 // A pathname beginning with // would otherwise become a network-path URL
 // when assigned to an anchor. Preserve preview hosts, but never credentials,
 // non-web schemes, other routes or ambiguous encoded path separators.
 if(!["https:","http:"].includes(url.protocol)||url.username||url.password||
  !/^\/(?:(?:tr|zh|hi|pt-br|fr|de|ru|ja|es)\/)?tractors\/$/.test(url.pathname))
  throw Error("Unsupported catalogue URL");
 url.searchParams.set("country",country);
 return url.pathname+url.search+url.hash;
}
