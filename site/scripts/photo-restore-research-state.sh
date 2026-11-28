#!/usr/bin/env bash
# Only in existing trusted-main photo research workflow. Never restore PR artifacts.
set -euo pipefail
[[ "$GITHUB_REF" == refs/heads/main ]]
# A rerun reuses the same run ID and may lose reservations from attempt 1.
[[ "${GITHUB_RUN_ATTEMPT:-}" == 1 ]]
mkdir -p research-state
# Latest completed trusted run, including failed runs: never silently restore an older checkpoint.
prev=$(gh api "repos/$GITHUB_REPOSITORY/actions/workflows/batch-photo-research.yml/runs?branch=main&status=completed&per_page=100" --jq '[.workflow_runs[] | select(.head_branch=="main" and (.event=="schedule" or .event=="workflow_dispatch" or .event=="push"))] | sort_by(.created_at) | reverse | .[0].id // empty')
if [[ -n "$prev" ]]; then
  # Discover whether the latest prior run already used the new checkpoint contract.
  count=$(gh api "repos/$GITHUB_REPOSITORY/actions/runs/$prev/artifacts?per_page=100" --jq '[.artifacts[] | select(.name=="tractorvs-shared-photo-state")] | length')
  if [[ "$count" == 1 ]]; then
    [[ "${BOOTSTRAP:-false}" != true ]] # existing state cannot be bootstrapped again
    gh run download "$prev" --repo "$GITHUB_REPOSITORY" --name tractorvs-shared-photo-state --dir research-state
    test -s research-state/commons-budget.json
    test -s research-state/checkpoint.json
    # A digest manifest prevents inadvertent partial/mixed restoration; trust comes from the selected workflow.
    python site/scripts/photo-research-checkpoint.py verify research-state "$prev"
    exit 0
  fi
  # Never reset if any previous checkpoint-bearing run exists. Migration is a separate explicit decision.
  [[ "$count" == 0 ]]
  [[ "${BOOTSTRAP:-false}" == true && "$GITHUB_EVENT_NAME" == workflow_dispatch ]]
  older=$(gh api "repos/$GITHUB_REPOSITORY/actions/artifacts?name=tractorvs-shared-photo-state&per_page=1" --jq '.total_count')
  [[ "$older" == 0 ]]
else
  [[ "${BOOTSTRAP:-false}" == true && "$GITHUB_EVENT_NAME" == workflow_dispatch ]]
  older=$(gh api "repos/$GITHUB_REPOSITORY/actions/artifacts?name=tractorvs-shared-photo-state&per_page=1" --jq '.total_count')
  [[ "$older" == 0 ]]
fi
# First migration: no inference that old provider requests were zero; defer Commons for 24 hours.
python - <<'PY'
import json,time,pathlib
p=pathlib.Path('research-state/commons-budget.json')
now=int(time.time()*1000)
with p.open('x') as f: json.dump({'version':1,'provider':'commons','requests':[],'cooldownUntil':now+86400000},f)
for name,obj in [('commons-collector.json',{'version':1,'cooldownUntil':0,'files':{}}),('independent-state.json',{'version':1,'jobs':[],'cooldowns':[]})]:
    with p.with_name(name).open('x') as f: json.dump(obj,f)
PY
