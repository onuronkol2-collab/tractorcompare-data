import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";

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
    // hreflang is already emitted in each page head; unused XML namespaces are not needed.
    namespaces: { news: false, image: false, video: false, xhtml: false },
  })] : [],
});