# Mobile catalogue and technical comparison usability — 23 November 2026

## Baseline and visitor task

Observed in the existing source at main `4ce6aefef7ba29e9610c4ef044a9dd80329a93b8`: catalogue facet fields use a single column below 490 CSS px; four 48 px controls and labels require multiple vertical rows before results. Facet selects inherit 14 px labels and the country selector inherits a 12 px surrounding panel, risking mobile text zoom. The comparison already exposes a semantic `<table>` with a caption, explicit column and row headings, and two model values side-by-side on phones. Its citations are small 13 px text targets and row/model distinction can be improved without replacing the table.

Task: on 320/390/768 px screens, apply filters and return to actual published tractors without needless vertical scrolling; inspect the left and right tractor values and open a real source using touch or keyboard. This is a design hypothesis grounded in inspected code; no participant or RUM study was conducted.

## Narrow implementation

- At 360–940 px, keep two filter columns (390 px phones now show two controls per row). At ≤359 px use one column. Preserve already-shipped SSR links, all existing filter/query/sort/URL/country logic, and four touch-friendly controls.
- Set all facet selectors and the country selector to at least 16 px font-size to avoid involuntary mobile zoom; country selector remains 44 px tall.
- On mobile comparison cards retain the exact semantic table, row headers, column headings, two model-specific data cells and every source citation. Distinguish the second model gently; improve reading rhythm, source links to at least 14 px/36 px and focus-within feedback. No fabricated data, source changes, or change to comparison sorting.
- CSS only plus read-only Playwright regressions. No changes to Indexed URLs, canonical/hreflang, sources/photos/licenses, RLS, moderation, consent, AGENTS.md, the model data or the Worker.

## Release gates and rollback

Expect Playwright/axe on Chromium, Firefox, WebKit and mobile Chromium; checks for 320/390/768 layout, no horizontal page overflow, preserved filters/reset URLs and tabular semantics. Node build, Golden Rule and Cloudflare safety checks must be green. Merge and production separately verified, not inferred from a passing build; do not claim improved SEO rank, RUM or user satisfaction. Roll back via a targeted revert of this PR's CSS and test changes.
