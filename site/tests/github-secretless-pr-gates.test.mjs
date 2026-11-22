import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";

const workflows={
 production:readFileSync(new URL("../../.github/workflows/tractorvs-production-release-check.yml",import.meta.url),"utf8"),
 translation:readFileSync(new URL("../../.github/workflows/translation-coverage.yml",import.meta.url),"utf8")
};
test("secret-bearing production jobs reject forks and Dependabot without skipping main push",()=>{
 const p=workflows.production;
 assert.match(p,/github\.event_name != 'pull_request' \|\|/);
 assert.match(p,/github\.event\.pull_request\.head\.repo\.full_name == github\.repository/);
 assert.match(p,/github\.event\.pull_request\.user\.login != 'dependabot\[bot\]'/);
 assert.match(p,/TRACTORVS_SUPABASE_ANON_JWT/);
 assert.match(p,/npm run build:production/);
 assert.match(p,/npx wrangler deploy --dry-run/);
 assert.doesNotMatch(p,/pull_request_target/);
});
test("protected translation production preview cannot be run by forks/Dependabot",()=>{
 const p=workflows.translation;
 assert.match(p,/github\.event_name == 'pull_request' &&/);
 assert.match(p,/github\.event\.pull_request\.head\.repo\.full_name == github\.repository/);
 assert.match(p,/github\.event\.pull_request\.user\.login != 'dependabot\[bot\]'/);
 assert.match(p,/SUPABASE_ANON_KEY: \$\{\{ secrets\.TRACTORVS_SUPABASE_ANON_JWT \}\}/);
 assert.match(p,/TRANSLATION_MAX_TR_OCCURRENCES: "0"/);
 assert.match(p,/TRANSLATION_MAX_EN_SOURCE_OCCURRENCES: "0"/);
 assert.match(p,/TRANSLATION_ZERO_LOCALES: "tr,zh,hi,de,ru,ja"/);
 assert.doesNotMatch(p,/pull_request_target/);
});
