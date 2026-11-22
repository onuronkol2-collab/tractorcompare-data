/**
 * Resolve the site's sitemap index without interpreting callback positional
 * arguments as JSON parsing flags. Public photo discovery must fail closed on
 * foreign/noncanonical URLs or non-sitemap responses.
 */
const INDEX=/<sitemapindex(?=[\s/>])/i;
const URLSET=/<urlset(?=[\s/>])/i;
const MAX_CHILDREN=1000;
const MAX_PAGES=100000;

export function sitemapLocs(xml) {
  if (typeof xml !== "string") throw new TypeError("Sitemap response must be XML text");
  return [...xml.matchAll(/<loc>\s*([^<]+?)\s*<\/loc>/gi)]
    .map(match => match[1].replaceAll("&amp;", "&"));
}

function canonicalPublicUrl(input, origin, kind) {
  let parsed;
  try { parsed=new URL(input); }
  catch { throw Error(kind+": invalid URL"); }
  if (parsed.protocol!=="https:" || parsed.origin!==origin || parsed.username ||
      parsed.password || parsed.search || parsed.hash)
    throw Error(kind+": noncanonical or off-origin URL "+parsed.href);
  return parsed.href;
}

export async function fetchIndexedSitemapPages(indexXml, fetchXml, {origin}={}) {
  if (typeof fetchXml!=="function") throw TypeError("Sitemap fetcher must be a function");
  const expectedOrigin=new URL(origin).origin;
  if (!INDEX.test(indexXml)) throw Error("Sitemap index must contain <sitemapindex>");
  const children=sitemapLocs(indexXml).map(url=>canonicalPublicUrl(url,expectedOrigin,"Sitemap child"));
  if (!children.length || children.length>MAX_CHILDREN) throw Error("Invalid sitemap index child count");
  if (new Set(children).size!==children.length) throw Error("Duplicate sitemap index child");
  // This explicit lambda is important: .map(fetchXml) forwards the array index
  // to positional arguments and once made sitemap XML parse as JSON.
  const documents=await Promise.all(children.map(url=>fetchXml(url)));
  const pages=[];
  for (const xml of documents) {
    if(typeof xml!=="string"||!URLSET.test(xml))
      throw Error("Sitemap child must be an XML <urlset> document");
    const next=sitemapLocs(xml).map(url=>canonicalPublicUrl(url,expectedOrigin,"Sitemap page"));
    if(pages.length+next.length>MAX_PAGES)throw Error("Sitemap exceeds research safety limit");
    pages.push(...next);
  }
  if (!pages.length) throw Error("Sitemap index contains no public pages");
  return pages;
}
