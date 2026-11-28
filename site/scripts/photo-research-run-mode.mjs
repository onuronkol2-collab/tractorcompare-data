import { readFile, appendFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateBudget } from './photo-shared-commons-budget.mjs';

export function resolveResearchMode({event, requested = '', budget, now}) {
  validateBudget(budget);
  if (!Number.isSafeInteger(now) || now < 0 || budget.requests.some(t => t > now)) {
    throw Error('Invalid research clock; pause providers');
  }
  let mode;
  if (event === 'schedule') {
    if (requested !== '') throw Error('Unexpected scheduled input');
    mode = 'research';
  } else if (event === 'workflow_dispatch') {
    if (!['bootstrap', 'restore', 'research'].includes(requested)) throw Error('Invalid manual mode');
    mode = requested;
  } else throw Error('Unsupported research trigger');
  return mode === 'research' && budget.cooldownUntil > now ? 'deferred' : mode;
}

async function main() {
  if (process.env.GITHUB_REF !== 'refs/heads/main' || process.env.TRACTORVS_SHARED_COMMONS_LANE !== '1') throw Error('Trusted main required');
  const path = process.env.TRACTORVS_COMMONS_BUDGET_FILE;
  const output = process.env.GITHUB_OUTPUT;
  if (!path || !output) throw Error('Restored budget and output required');
  const bytes = await readFile(path);
  if (bytes.length > 1024 * 1024) throw Error('Budget cap');
  const mode = resolveResearchMode({event:process.env.GITHUB_EVENT_NAME,requested:process.env.REQUESTED_MODE || '',budget:JSON.parse(bytes.toString('utf8')),now:Date.now()});
  await appendFile(output, 'mode='+mode+'\n');
  console.log('Resolved research mode: '+mode);
}
if(process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await main();
