# ADIM48 – exact identity guard v2 (active models only)

The earlier \`20261118_tractorvs_duplicate_identity_guard.sql\` attempted a
full-history unique index. It intentionally failed on the two discovered groups:
one archived empty TIGRE 3800 + one draft, and two identical-looking SAME
Frutteto S/V draft entries. **Do not re-run the earlier migration.**

Use \`20261118_tractorvs_active_identity_reconcile.sql\` instead. This
migration checks both SAME draft records, all their specification evidence,
their official source references and external foreign-key usage. Only if
equivalent will it archive the specific redundant SAME draft UUID, retain its
two spec rows, and build a unique partial index covering non-archived models.

No DELETE, RLS change or publication occurs. Every operation takes place in
one transaction. Any mismatch rolls back all changes. The read-only audit is
\`20261118_tractorvs_active_duplicate_audit.sql\`.

The 2026 product-range SAME record remains **draft**, not a validated
model-specific published record. The TIGRE draft remains **draft** until
specifications are individually checked. Publishing is out of scope.

For backup or rollback consult the DBA: removing the unique index removes the
safety protection and reactivating the archived duplicate would restore a
conflicting active identity. Never do those operations blindly.
