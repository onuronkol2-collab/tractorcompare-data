import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";
import {readFileSync} from "node:fs";

// Only dates backed by a persistent rendered-content change audit are used.
// Never put the build time into every sitemap <lastmod>.
const recordedDates=JSON.parse(readFileSync(new URL("./src/data/sitemap-lastmod.json",import.meta.url),"utf8"));
if(recordedDates.version!==1||typeof recordedDates.dates!=="object")
  throw Error("Invalid provenance-based sitemap-lastmod map");


const siteUrl = process.env.SITE_URL;
const indexingEnabled = process.env.PUBLIC_INDEXING_ENABLED === "true" && Boolean(siteUrl);

export default defineConfig({
  ...(siteUrl ? { site: siteUrl } : {}),
  output: "static",
  build: {
    format: "directory",
  },
  integrations: indexingEnabled ? [sitemap({
    // Only permanent HTML pages belong in the sitemap. 404/chooser URLs do not.
    filter: (page) => {
      const pathname = new URL(page).pathname;
      return !/^\/404(?:\.html|\/|$)/.test(pathname) && !pathname.startsWith('/language/')
        && !/^\/(?:tr\/|zh\/|hi\/|pt-br\/|fr\/|de\/|ru\/|ja\/|es\/)?forum(?:\/|$)/.test(pathname);
      // UGC is intentionally excluded from XML sitemaps until real moderated
      // topics and independent content-quality reviews justify indexing.
    },
    serialize(item) {
      const pathname = new URL(item.url).pathname;
      const verified = recordedDates.dates[pathname];
      if(typeof verified==="string" && Number.isFinite(Date.parse(verified)) &&
         Date.parse(verified)<=Date.now())item.lastmod=verified;
      return item;
    },
    // hreflang is already emitted in each page head; unused XML namespaces are not needed.
    namespaces: { news: false, image: false, video: false, xhtml: false },
  })] : [],
});