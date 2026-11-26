# Reporting and moderation staged release — 2026-11-26

## Scope
This independent report-only release preserves the already-applied accepted-solutions table. It provides topic/reply reporting, five fixed reason codes, one report per target/member, a UTC daily cap of ten committed reports, a private moderator allowlist, an authenticated moderation queue, terminal review/dismissal decisions and a protected audit trail. Moderator access uses server-side RLS and explicit enrollment, never user-editable profile metadata. Browser roles cannot read reporter identifiers or change evidence; review decisions do not hide/delete topics or replies. The initial reporting capability switch is false. Existing forum content is unchanged.

## Acceptance and staging
- Verify the dedicated PostgreSQL fixture, concurrent twelve-request quota test (ten allowed, two rejected), SQL delimiter preflight, site build, four browser projects and existing production safety gates.
- Check the current database schema, privileges, policy shape and advisors. Apply only the new report-only SQL after all required tests pass; do not reapply the combined #726 candidate or the accepted-solutions migration.
- Verify anonymous/ordinary/moderator access boundaries, default disabled flag, no reporter identity in public API projections, and actual Cloudflare production release. No real user report should be created as a smoke fixture.
- No moderator identity is inferred. Enroll only an explicitly authorized verified account via a trusted administrator after confirming the account. No ordinary user can enroll or activate reporting.
- Schedule and verify daily execution of the private retention procedure by an authorized database administrator before enabling ingestion. The production preflight found pg_cron absent. Do not automatically install extensions, enable paid services or switch ingestion on until there is a verified retention mechanism. Pending reports expire after 90 days; reviewed/dismissed reports and corresponding audit rows after 30 days from review; obsolete quota counters after seven days. These are proposed operational defaults, not a claim of legal compliance.
- Set enabled=true only after a verified moderator, retention scheduler, API and live UI are ready. To stop intake, set enabled=false; moderators may finish existing queue items.
- Rollback disables ingestion first, exports any real reports if needed, then removes only reporting objects. Never roll back the existing accepted-solutions table.

## Testing discipline
The SQL test and concurrent requests use synthetic fixture data in an isolated PostgreSQL 17 container, with explicit PGUSER/PGDATABASE and a one-token health check. Use literal callback replacements for SQL edits; run the repository-wide delimiter preflight and actual SQL tests. Browser tests use inert fixtures, not live users, with an authorized mock session and verified response. Public markup stays hidden until backend capability and session checks succeed.
