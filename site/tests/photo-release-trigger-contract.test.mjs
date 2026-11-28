import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=name=>readFileSync(new URL('../../.github/workflows/'+name+'.yml',import.meta.url),'utf8');
const prBlock=s=>s.slice(s.indexOf('  pull_request:'),s.indexOf('\npermissions:')<0?s.length:s.indexOf('\npermissions:'));
test('photo research never creates a skipped main-only job on pull requests',()=>{
 const research=read('batch-photo-research');
 assert.doesNotMatch(research,/pull_request/);
 assert.match(research,/schedule:/);
 assert.match(research,/research_all_models:/);
 assert.match(research,/group: tractorvs-all-model-photo-research/);
 const validation=read('photo-research-validation');
 assert.match(validation,/pull_request:/);
 assert.match(validation,/validate_photo_research:/);
 assert.match(validation,/node --test site\/tests\/photo-\*\.test\.mjs/);
 assert.doesNotMatch(validation,/research_all_models:|workflow_dispatch:|schedule:/);
 assert.doesNotMatch(validation,/if:.*github\.event_name/);
});
test('photo infrastructure changes trigger required release evidence',()=>{
 const patterns=['.github/workflows/batch-photo-research.yml','.github/workflows/photo-research-validation.yml','site/scripts/photo-*.mjs','site/scripts/photo-*.py','site/scripts/batch-photo-discovery.mjs','site/scripts/archive-brand-photo-discovery.mjs','site/scripts/extract-archived-tractor-inventory.py','site/tests/photo-*.test.mjs','site/tests/photo-*.py','site/tests/fixtures/photo-offline-fetch.mjs'];
 for(const workflow of ['photo-research-validation','playwright-accessibility','tractorvs-sitemap-history']) {
  const block=prBlock(read(workflow));
  for(const pattern of patterns)assert.ok(block.includes('- "'+pattern+'"'),workflow+': '+pattern);
 }
});
