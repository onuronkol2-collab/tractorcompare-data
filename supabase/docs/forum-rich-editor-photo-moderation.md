# TractorVS forum — rich editor and private photo moderation

Updated 2026-11-21. Implements Photo Media v1 on Supabase with **zero automatic public exposure**.

## Member experience

- Sign in to TractorVS forum. Guests can read but cannot post or upload.
- Type a topic or reply and optionally use the toolbar: bold, italic, quotation, bullets, inline code or emoji; preview is DOM-text only, never arbitrary HTML.
- Photos: **up to 3 JPEG/PNG/WebP images**, each source at most **15 MB**, re-encoded client-side as WebP with a target **max 400 KB**; EXIF location and device metadata are stripped by canvas re-encoding. Photos are briefly previewed locally with Blob URLs.
- Enter an accurate **10–160-character descriptive alt text per photo** and explicitly declare rights to share them publicly. Do not submit photos of other people, addresses, plate numbers or sensitive documents without consent.
- The text is submitted with `status=pending`; each photo is separately reserved with `status=pending` and then uploaded under the owner's private Storage path.
- If a photo fails, the message is **not resubmitted**; a same-tab retry option uploads pending media. The original photos are not persisted to sessionStorage, so a reload may require re-selecting files. A successful form post is not proof a photo was uploaded.
- Max **12 photo reservations per account per rolling 24 hours** (besides existing forum post/reply quotas).

## Moderator workflow (required)

1. Review the **text post** in `tc_forum_topics` or `tc_forum_replies`. Independently approve only lawful, accurate, original content; keep all other text `pending` or reject it. This existing action is not part of the photo uploader.
2. Query `tc_forum_media` with a privileged moderation console, selecting `id,author_id,topic_id,reply_id,alt_text,status,storage_path,created_at` for pending items. The table has row-level security and the path/author columns are NOT available to ordinary members; do not expose its full data via REST.
3. Inspect each **private** object using the authorized Supabase admin or a short-lived moderator-signed URL. Check it is a real WebP, with no personal info, unsafe claims, copied marketing images, external branding or rights violations. The member's rights checkbox is a declaration, **not independent licensing proof**.
4. Only after the **parent text is published** and the matching object exists, approve a photo via reviewed SQL:

   ```sql
   BEGIN;
   UPDATE public.tc_forum_media SET status='published'
   WHERE id = '<MODERATOR_VERIFIED_MEDIA_UUID>'::uuid
     AND status='pending';
   -- Verify exactly one updated row, object identity, parent publication and moderation log.
   COMMIT;
   ```

   The database approval trigger refuses publication if the file or published parent is missing. Do not bulk approve all pending images.
5. After approval, the **public Edge gateway** `forum-media?id=<UUID>` requires both media and parent published; it serves only private WebP verified by magic bytes. The public `tc_forum_public_media` projection includes only approved image IDs, safe captions and parent IDs (never storage paths, author IDs, private JWTs or moderation notes).
6. Existing GitHub moderated-forum fingerprint now observes approved media. Its next successful run triggers a static website rebuild that includes accessible thumbnails, full-image links, conditional ImageObject structured data and **approved images only on indexable forum pages in the image sitemap**. SEO eligibility of posts still follows the original distinct moderated and translation quality gate.

## Operational restrictions

- **Do not** make `tc-forum-media` public or reuse the avatar bucket. No unapproved image/translation should be crawled or shown.
- The public Edge function uses a secret only server-side; never copy its service-role key into static HTML.
- The source code lives at `supabase/functions/forum-media/index.ts` and is deployed as `forum-media` with public HTTP access because it independently verifies every object and its published parent.
- Private account IDs, photo paths and location/camera metadata are never added to JSON-LD or sitemap data.
- Never claim Google has indexed a page from a 200 response or an XML sitemap alone.
- Existing user-generated posts require their own moderation. Photo approval must not imply that a third-party photo is licensed.

## Rollback and verification

- A guarded, **non-executed** rollback file is at `supabase/rollback/20261121200000_forum_photo_attachments_v1_rollback.sql`. It refuses to remove schema/bucket if any photo objects or DB rows exist. If real uploads exist, migrate/export them and handle user privacy before rollback.
- Test SQL: storage bucket public=false with MIME WebP/400000B; `tc_forum_media` RLS enabled, `tc_forum_public_media` security_invoker+barrier; `anon` cannot read storage_path, `authenticated` cannot read storage_path or author_id or UPDATE media status; only authenticated owner-scoped Storage insertion policies; quota function not callable by ordinary roles; unknown/unapproved gateway UUID returns 404.
- Test code: `site/tests/forum-editor.test.mjs` and `scripts/tractor-forum-publication-autosync.test.mjs`.
- Test browsers: `site/e2e/forum-editor-media.spec.mjs`, plus existing `site/e2e/forum-compose.spec.mjs`, in Chromium, Firefox, WebKit and mobile Chromium with accessibility axe workflow.
- Live production and a real authenticated end-to-end upload should be checked before declaring member image uploads fully proven; offline mocked browser tests are not real network RLS tests.
