# TractorVS — sitewide keyboard and motion accessibility pass

## Scope and evidence (22 November 2026)
- Live, public HTML was sampled for `/tr/`, `/tr/tractors/`, `/tr/forum/`, and `/tr/articles/` through a read-only URL extraction. The Turkish home and catalogue returned canonical/indexable metadata and the catalogue listed 388 published models. This is **not** a full Core Web Vitals or user-session performance audit.
- Code inspection found a shared `.skip-link` targeting `<main id="main">`, but no explicit focusability on the target. Shared stylesheet used smooth scroll on `html` with no sitewide reduced-motion override. Numerous interactive links rely on per-component focus styling; a global fallback improves keyboard visibility.
- Existing `site/src/components/TractorDetail.astro` linked independent and manufacturer references with repeated link wording. Accessible names now include each exact specification label without inventing claims or changing the visible wording.

## Changes
- Focusable main landmark across all 10 locales, preserving the skip link and server-rendered HTML.
- Separate CSS for keyboard focus and reduced-motion, intentionally avoiding in-flight main stylesheet/typography PRs.
- Source citations' accessible names include their specification label in the current locale.
- Node and four-browser Playwright regression checks; tests also assert clean canonical/indexability on Turkish home.

## Quality gates and rollback
Review complete site Node tests, Astro build, production release gate, Golden Rule, Playwright Chromium/Firefox/WebKit/Pixel + axe, CodeQL and concurrent PR conflict state before merge. Only after merge check Cloudflare deployment and actual keyboard behavior on live desktop and phones; do not report a PR or browser mock as deployed production.

Revert this small PR if failures occur. No Supabase/RLS, moderation, tracking, licensed imagery, forum login, sitemap or published model contents changed. GEO and ranking improvements are not inferred from this accessibility change.

## Follow-up priority
1. Resolve the already-open mobile readability PR #464 and forum layout PRs without merging conflicting files blindly.
2. Audit the 388-card catalogue's transfer bytes, mobile INP/LCP/CLS and 10-locale deep link parity before considering server-side pagination (Issue #218).
3. Confirm full production crawling, the search-console indexing trajectory and meaningful source-based, original editorial content. The reports are separate from HTTP/canonical correctness.
