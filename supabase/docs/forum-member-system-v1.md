# TractorVS Forum v1: identities, password/social sign-in, profiles, helpfulness and public contributor ranking

## Identity: one Supabase user across all methods
The existing passwordless email link + OTP flow is preserved. The new membership form adds:
- Email + password sign-up through Supabase Auth (minimum 12 characters requested by UI).
- Email + password login through Supabase Auth.
- Optional Google and GitHub OAuth via Supabase authorization endpoint. Both depend on provider enablement and redirect URL registration in the Supabase Dashboard; we cannot safely invent client IDs/secrets. The browser never contains service_role keys or OAuth client secrets.
- Auth access/refresh tokens stay in tab-scoped sessionStorage unless the member chooses **Keep me signed in for 7 days** on a private device. That opt-in mirrors the normal browser persistence behavior of Supabase Auth with a bounded, locally stored access+refresh token pair (seven days since last verified login); it survives closing the tab. On shared devices, members must uncheck the option and sign out. Only tokens are saved persistently, never passwords, email, profile data, uploaded images or private drafts. Passwords are sent only to Supabase Auth HTTPS. Session restoration still checks `/auth/v1/user` and uses refresh-token rotation. All browser storage readable by JavaScript involves a residual XSS/device compromise risk; strict CSP, safe DOM rendering, no unsafe injected HTML, and logout controls must be maintained.
- After initial registration, an email-confirmation step may be necessary depending on actual Auth settings. Do not disable confirmation for ease of onboarding.

## Google/GitHub one-time admin configuration
1. In Google Cloud Console, configure OAuth consent screen and create a **Web** OAuth client (do not paste secrets in chat). Use the Supabase callback:
   https://aaufxtcvnzgavtlintiv.supabase.co/auth/v1/callback
2. In Supabase Dashboard -> Authentication -> Providers -> Google, enable Google and enter its client ID + client secret privately in the dashboard. Do the same for GitHub OAuth application if desired.
3. In Supabase Dashboard -> Authentication -> URL Configuration, set the production Site URL to https://tractorvs.com and add explicit redirect allowlist entries:
   https://tractorvs.com/forum/
   https://tractorvs.com/tr/forum/
   https://tractorvs.com/zh/forum/
   https://tractorvs.com/hi/forum/
   https://tractorvs.com/pt-br/forum/
   https://tractorvs.com/fr/forum/
   https://tractorvs.com/de/forum/
   https://tractorvs.com/ru/forum/
   https://tractorvs.com/ja/forum/
   https://tractorvs.com/es/forum/
   plus known published forum topic paths if OAuth is offered inside threads.
4. Verify real sign-in in a controlled test account and the 10 locales. Login must not be announced as live until admin providers and callbacks are proven.

## Profiles, avatars and member privacy
- Public profiles include username, display name, short biography, favorite tractor brand and optional avatar. They never contain emails, private login data or social identity provider tokens.
- Members create/update only their own profile with RLS based on auth.uid. Username is unique, case-insensitive and restricted to a conservative URL-safe format.
- Avatar is a public 256x256 WebP converted in the browser (EXIF stripped), under 350 KB at the fixed path USER_ID/avatar.webp. Only the owner can insert/update/select/delete in Supabase Storage; anonymous public image retrieval is supported by the bucket.
- Explicit check box allows a member to hide themself from the public scoreboard. The SQL view enforces that choice, not merely the frontend.
- Saved discussions are private to their owners and don't affect points.

## Fair and original engagement system
- 3 points per **published** topic; 2 points per **published** reply in a published topic; +2 points per helpful vote received, capped at 10 helpful votes per reply.
- The last-30-days leaderboard deliberately counts recent moderated **topics and replies** only. Historic helpful votes aren't misrepresented as recent just because a new vote arrived.
- Helpful votes are allowed only on published replies within published topics; members cannot vote for themselves. One vote per member/reply, max 20 votes per account per 24-hour period, RLS on all votes.
- Voters are never publicly listed; publicly readable totals are aggregated, not voter identities. All posting and reply moderation remains in effect.
- Derived reputation badges: New Member, Contributor and Community Mentor. Badges are NOT credentials or expert certification, and are never added as fact to search-engine structured data.
- Topical content stays governed by existing SEO publish/indexing and translation checks. Rankings are hydrated client-side; public scores are not auto-indexed as new thin SEO pages.

## Operations / rollback / QA
Migration:
supabase/migrations/20261121130000_forum_members_profiles_votes_v1.sql

Rollback (only if all member, vote, bookmark and avatar data is empty):
supabase/rollback/20261121130000_forum_members_profiles_votes_v1_rollback.sql

Verification:
supabase/verification/verify_forum_members_v1.sql

Run Node tests, Astro build, Chromium/Firefox/WebKit/Pixel 7 Playwright and axe. Validate provider status in dashboard, email confirmation, migration SQL/RLS/storage policies, avatar type/size/ownership and public/hidden rank behavior. Do not claim OAuth or real email delivery was verified from static simulation.

Later milestones: moderated "best answer" (thread owner selects approved helpful reply), tractor-owner verification without disclosing serial number, opt-in topic-following notifications, source-backed expert Q&A, searchable member profiles only after original-content/moderation policy. Do not gamify spam or promise rewards/credentials based on unverified claims.


## November 2026 member engagement and new-member discovery (PR #406)

On published topic pages we show **unique authenticated member readers** and topic likes. Reader counts include each signed-in account once per topic, not anonymous page views and not any measured impression/traffic estimate. Topic likes are restricted to the account's own INSERT/DELETE privileges by RLS; self-likes are rejected; 20 new likes/day UTC maximum prevents vote farming. Totals are maintained by SQL triggers, exposed only when the parent topic is published, and are **not** inserted into Google Schema.org structured data or represented as third-party popularity rankings.

The new bottom-of-forum member list shows at most 12 profiles from the pre-existing `tc_member_scores` view, sorted by their actual join timestamps. It respects the existing `show_leaderboard=true` privacy choice, now described to members as opting into both public rankings and member lists. Private account email, identities of voters, visitors, and auth details are never listed.

Migration: `supabase/migrations/20261122180000_tc_forum_topic_likes_unique_member_reads.sql`. Validate with `supabase/verification/verify_forum_topic_engagement_20261122.sql`, using Supabase Security Advisors. Rollback refuses to delete any engagement records and must never be used on non-empty live tables. Add live test-account verification without creating misleading synthetic live engagement data.
