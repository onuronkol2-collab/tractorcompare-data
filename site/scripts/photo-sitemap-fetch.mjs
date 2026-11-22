/**
 * Read every child of the public sitemap index as XML text.
 * Array.map(fetch) is unsafe when fetch has optional positional arguments:
 * map passes its numeric index as argument #2 (our legacy HTTP helper interpreted
 * that as asJson=true, causing JSON.parse on sitemap XML).
 */
export function sitemapLocs(xml) {
  if (typeof xml !== "string") throw new TypeError("Sitemap response must be XML text");
  return [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)]
    .map(match => match[1].replaceAll("&amp;", "&"));
}
export async function fetchIndexedSitemapPages(indexXml, fetchXml) {
  const children=sitemapLocs(indexXml);
  if (!children.length) throw Error("No sitemap index children");
  const documents=await Promise.all(children.map(url => fetchXml(url)));
  return documents.flatMap(sitemapLocs);
}
