# Homepage photo-credit contrast correction (23 November 2026)

The scheduled [14-route mobile Lighthouse baseline](https://github.com/onuronkol2-collab/tractorcompare-data/actions/runs/45119323039) found an accessibility contrast failure on the Turkish homepage photo credit link: foreground `#2c6743` against the `#19271f` image-frame background, contrast approximately 2.31:1. The inherited shared photo credit color is light but the homepage override made the link too dark.

This isolated change sets only `.home-featured-card .tractor-photo-short-credit a` to the high-contrast color `#d8efc5`. The photograph, source URL, photographer, license attribution, image metadata, zoom behavior, layout, font sizes and JS remain unchanged.

## Acceptance
- Node regression test measures CSS WCAG contrast for the actual frame/link pair and requires at least 4.5:1.
- Run existing Node suites, all browser accessibility/keyboard checks, production bundle and Golden Rule checks.
- Validate representative homepage images under mobile and desktop with the browser. Actual production scores require re-running Lighthouse after deployment. A single 66/100 mobile performance score does **not** prove stable regressions or improvement from this color-only patch.
- No changes to the active mobile catalogue/compare UI PR #537, analytics PR #535, model datasets, photos, RLS, forum, canonical, hreflang, sitemap, AGENTS.md or production deployment.
