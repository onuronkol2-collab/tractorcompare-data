# TractorVS photographic media policy

All published, draft and future tractor models are within the media research scope.

Release a real photo only when the exact model identity and redistribution rights
are documented. Similar models and unverified configurations are NOT interchangeable.
Photos of a general model should explicitly note that pictured equipment may differ
from the particular tractor variant described by the data.

Initial copyright-cleared source photographs are from Wikimedia Commons under
CC BY-SA 3.0/4.0. Every use must show the photographer, source and license link,
without suggesting the photographer endorses TractorVS. A translucent site label
over the page is NOT a claim that TractorVS owns the copyright. ShareAlike applies
to derivative files, and altered versions must be identified as such.

Only getPublicCatalog() is allowed to feed indexed model pages and image-sitemap.xml.
Draft tractor records and unapproved candidate images remain private. A future
image queue should reference public.tractors.id and require a rights and identity
review before publication. Source documents and raw measurements are not changed.

Google Images optimization: crawlable image elements with descriptive ten-language
alt text; stable image URLs; nearby captions/credit; fixed aspect ratios and
optimized thumbnails; ImageObject with creator, creditText, copyrightNotice and
license; image sitemap indexed only for published models; full-screen native dialog
with keyboard Escape; no invented Product offers, ratings or model images.

Existing approved image assets are externally hosted licensed photographs.
Site-hosted renditions are a future improvement, once each copyright condition is
satisfied and correct attribution is retained. Google image indexing and rankings
are never guaranteed.

## Daily evidence discovery and independent verification

The repository workflow `.github/workflows/batch-photo-research.yml` now
executes **every day at 04:15 UTC** (07:15 Europe/Istanbul), in addition to
authorized manual starts and the one-time main-branch bootstrap on merge.
It collects photo-candidate evidence for the historical model archive and
the live public model catalogue, storing machine-readable JSON and CSV as
30-day GitHub Actions artifacts. PR validation runs only copyright and
model-matching unit tests, not a full external image crawl.

**Discovery is not publication.** Wikimedia Commons metadata and an exact
file-title match are only preliminary checks. Before a new photo is publicly
added to `site/src/lib/tractor-photos.ts` or
`site/src/lib/historical-licensed-photos.ts`:
- Match brand, model and visible equipment; mark configuration differences.
- Inspect the original file page, author, license version and any additional
  permission notices. A manufacturer's public product photo is NOT an
  unrestricted redistribution license.
- Keep creator/source/license attribution, full-screen display, SEO ImageObject
  metadata and stable first-party image URLs.
- Never set `rights_verified_at` or `image_asset_url` in the database
  simply because an image appeared on a public product page.
- Do not disclose unpublished tractor identities via public GitHub artifacts;
  the public-photo sweep uses the published sitemap only.
