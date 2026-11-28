/** Merge a recorded, public, operator-reviewed Commons cooldown into restored
 * shared state before any provider request. No new reservation or publication. */
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { atomicBudgetUpdate, pauseBudget, validateBudget } from './photo-shared-commons-budget.mjs';
export function applyRecordedHold(state, hold, now) {
  if (hold?.version !== 1 || hold.provider !== 'commons' || hold.reason !== 'upstream_http_429' ||
      !Number.isSafeInteger(hold.observedAt) || hold.observedAt < 0 ||
      !Number.isSafeInteger(hold.cooldownUntil) || hold.cooldownUntil < hold.observedAt ||
      hold.cooldownUntil - hold.observedAt < 86400000 ||
      !Number.isSafeInteger(now) || now < hold.observedAt) throw Error('Invalid recorded Commons hold');
  validateBudget(state);
  return hold.cooldownUntil <= now ? state : pauseBudget(state, now, hold.cooldownUntil - now);
}
async function main(){
  if (process.env.TRACTORVS_SHARED_COMMONS_LANE !== '1' || process.env.GITHUB_REF !== 'refs/heads/main' || !process.env.TRACTORVS_COMMONS_BUDGET_FILE) throw Error('Trusted restored main lane required');
  const path = process.argv[2]; if (!path) throw Error('Recorded hold path required');
  const bytes = await readFile(path); if (bytes.length > 8192) throw Error('Recorded hold too large');
  const hold = JSON.parse(bytes); const now = Date.now();
  await atomicBudgetUpdate(process.env.TRACTORVS_COMMONS_BUDGET_FILE, state => ({state:applyRecordedHold(state,hold,now)}));
}
if(process.argv[1] && resolve(process.argv[1])===fileURLToPath(import.meta.url)) await main();
