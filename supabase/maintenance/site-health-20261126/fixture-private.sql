-- Only in disposable fixture DB; exact minimal private FK shape.
CREATE SCHEMA tc_assisted_private;
REVOKE ALL ON SCHEMA tc_assisted_private, tc_forum_reporting_private FROM PUBLIC,anon,authenticated;
CREATE TABLE tc_assisted_private.fixture_grants(id uuid PRIMARY KEY);
CREATE TABLE tc_assisted_private.publication_audit(
  request_id uuid PRIMARY KEY, grant_id uuid NOT NULL REFERENCES tc_assisted_private.fixture_grants(id)
);
CREATE TABLE tc_forum_reporting_private.review_audit(
  report_id uuid PRIMARY KEY, reviewer_id uuid NOT NULL REFERENCES auth.users(id)
);
ALTER TABLE tc_assisted_private.publication_audit ENABLE ROW LEVEL SECURITY;
ALTER TABLE tc_forum_reporting_private.review_audit ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON tc_assisted_private.publication_audit,tc_forum_reporting_private.review_audit FROM PUBLIC,anon,authenticated;
