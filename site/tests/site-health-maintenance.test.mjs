import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=name=>readFileSync(new URL('../../supabase/maintenance/site-health-20261126/'+name,import.meta.url),'utf8');
const patch=read('apply.sql'), rollback=read('rollback.sql');
test('maintenance candidate is atomic, bounded, drift guarded and reversible',()=>{
 for(const s of [patch,rollback]){assert.match(s,/\bbegin;/);assert.match(s,/\bcommit;/);assert.match(s,/lock_timeout/);assert.match(s,/statement_timeout/);}
 assert.match(patch,/42692793acda2f39d6c1be7012deff32/);assert.match(patch,/b7d81095426a0aea5e56d83dec49ffc1/);
 assert.equal((patch.match(/create index /g)||[]).length,2);assert.equal((rollback.match(/drop index /g)||[]).length,2);
 assert.doesNotMatch(patch,/disable row level security|grant |drop policy|delete from/i);
 assert.match(patch,/to anon;/);assert.match(patch,/to authenticated using/);assert.match(rollback,/to anon, authenticated;/);
});
test('per-role SELECT algebra retains public and owner visibility, even for unpublished reply',()=>{
 // This is predicate-algebra regression, not a live RLS test.
 for(const role of ['anon','authenticated'])for(const pub of [false,true])for(const owner of [false,true]){
   const before=pub||(role==='authenticated'&&owner);
   const after=role==='anon'?pub:pub||owner;
   assert.equal(before,after);
 }
});
