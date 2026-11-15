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
  integrations: indexingEnabled ? [sitemap()] : [],
});