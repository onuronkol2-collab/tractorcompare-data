# TractorVS sitewide design-quality release: research-first visual system

Date: 2026-11-23. Scope: visual CSS in `site/src/styles/research-layout.css`, shared by **every** Astro locale and page, and browser regression tests in `site/e2e/sitewide-research-design.spec.mjs`.

## Product task and observed starting point

The site is a **tractor research, model specification and comparison resource**, never a buying marketplace. Existing page families already contain deep-green hero regions, a sage palette, model specification tables, source notes and structured routes. However header microtype, card hierarchy, large sets of independently designed surfaces and long multilingual labels have diverged over successive changes. The existing 2026 readability pass enlarged many pieces of text; this patch builds a **coherent, reusable presentation layer** on top without replacing those improvements.

User task: from any of ten languages, locate catalogue / comparison / a model and its official source, understand what is verified, and navigate on mobile without clipping or hidden controls. Expected result: common research-card hierarchy, 15px source links, 16px forum form text, visible typography, calm focus/hover treatments, no fake offers or products, and 320px reflow.

## Decisions and boundaries

- Use the already-imported research CSS and introduce consistent CSS-only tokens for surfaces, border, shadow, radius, secondary text, reading width. No new fonts, tracking, JS, image downloads or page data.
- Make header nav text and footer link targets more readable. Technical values keep tabular figures and visible source labels; comparison remains a real data table with its intentional local horizontal-scroll behavior. Card hover movement only when users have not requested reduced motion.
- Long labels may wrap; do not truncate model names, units, licenses or publisher information. Keep the existing keyboard focus rings and analytics-consent settings.
- Maintain all 10 locale SSR content, canonical, hreflang, OG, JSON-LD, RLS, editorial drafts, licensed photographs and timestamps unchanged. The CSS adds no information to search engines and claims no observed search ranking gain.

## Acceptance and rollback

New Playwright checks: 1440px TR home card typography/tokens, 1280px catalogue and editorial layout, 320px TR/DE/HI/JA/PT-BR home reflow, readable footer and cards, reduced-motion hover disabled. The existing four-browser Chromium/Firefox/WebKit/mobile suite and golden/production safety build must pass, then **Cloudflare success plus real-live HTML + computed mobile visual inspection** must be verified separately. Real-user UX participation and Core Web Vitals RUM weren't measured; do not imply improvements in their outcomes.

Rollback: revert only this stylesheet and test commit. No SQL or user content changes.
