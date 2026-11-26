#!/usr/bin/env bash
set -euo pipefail
container="$1"
tmp=$(mktemp -d)
trap 'rm -rf "$tmp"' EXIT
# Twelve independent requests, same reporter/day; exactly ten may commit.
for n in $(seq 1 12); do
  (
    id=$(printf '40000000-0000-4000-8000-%012d' "$n")
    if docker exec -i "$container" psql -X -U postgres -d postgres -v ON_ERROR_STOP=1 -f - >"$tmp/$n.log" 2>&1 <<SQL
SET ROLE authenticated;
SELECT set_config('request.jwt.claims','{"sub":"00000000-0000-4000-8000-000000000002","email":"b@example.invalid","is_anonymous":false}',false);
INSERT INTO public.tc_forum_content_reports(topic_id,reason) VALUES('$id','spam');
SQL
    then
      echo success >"$tmp/$n.result"
    elif grep -q 'Daily report limit reached' "$tmp/$n.log"; then
      echo quota >"$tmp/$n.result"
    else
      cat "$tmp/$n.log" >&2
      echo unexpected >"$tmp/$n.result"
    fi
  ) &
done
wait
test "$(grep -l '^success$' "$tmp"/*.result | wc -l)" -eq 10
test "$(grep -l '^quota$' "$tmp"/*.result | wc -l)" -eq 2
docker exec -i "$container" psql -X -U postgres -d postgres -v ON_ERROR_STOP=1 -f - <<'SQL'
DO $test$ BEGIN
 IF (SELECT count(*) FROM public.tc_forum_content_reports)<>10 THEN RAISE EXCEPTION 'Concurrency count mismatch'; END IF;
 IF (SELECT reports_submitted FROM tc_forum_reporting_private.daily_report_quota WHERE reporter_id='00000000-0000-4000-8000-000000000002')<>10 THEN RAISE EXCEPTION 'Concurrency quota mismatch'; END IF;
END $test$;
SQL
echo "Concurrent report quota verified (10 accepted, 2 rejected)"
