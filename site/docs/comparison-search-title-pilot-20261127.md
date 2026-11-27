# Comparison search title pilot — 27 November 2026

The read-only Search Console report for 19–25 November 2026 identifies existing comparison landing pages in several languages as a candidate for clearer search titles. Device-level data supports mobile-first review, but limited impressions do not establish a causal CTR problem. Private analytics counts are not included here. Live on-page audit of five existing comparison routes found generic titles and relevant descriptions. Title length is an editorial guideline, not a Google ranking threshold.

Change only the ten localized comparison title strings in ui.ts. Use the genuine technical comparison intent, with distinct Brazilian Portuguese and Spanish wording; preserve existing descriptions, H1, URLs, canonical, hreflang, and source caveats. Do not modify TractorComparison.astro while PRs #775 and #758 include it. No new indexable query URLs, structured-data eligibility claim, or fabricated reviews.

Required explicit TEST: verify titles in the actual built HTML for all ten routes, title uniqueness, relevant existing descriptions and unchanged comparison functionality; review mobile search appearance after release using settled Search Console data. Search engines can rewrite titles; no CTR guarantee. No CI or publication initiated.
