import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,readFile,writeFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {fetchCommonsJson,CommonsCooldownError} from '../scripts/photo-commons-http.mjs';
import {initialBudget} from '../scripts/photo-shared-commons-budget.mjs';
const now=200000000;
async function withState(fn){const dir=await mkdtemp(join(tmpdir(),'tractorvs-budget-'));const path=join(dir,'budget.json');const old=process.env.TRACTORVS_COMMONS_BUDGET_FILE;const requireOld=process.env.TRACTORVS_REQUIRE_SHARED_COMMONS_BUDGET;try{process.env.TRACTORVS_COMMONS_BUDGET_FILE=path;process.env.TRACTORVS_REQUIRE_SHARED_COMMONS_BUDGET='1';await writeFile(path,JSON.stringify(initialBudget()));await fn(path);}finally{if(old===undefined)delete process.env.TRACTORVS_COMMONS_BUDGET_FILE;else process.env.TRACTORVS_COMMONS_BUDGET_FILE=old;if(requireOld===undefined)delete process.env.TRACTORVS_REQUIRE_SHARED_COMMONS_BUDGET;else process.env.TRACTORVS_REQUIRE_SHARED_COMMONS_BUDGET=requireOld;await rm(dir,{recursive:true,force:true});}}
const state=async p=>JSON.parse(await readFile(p,'utf8'));
const request=(fetchImpl)=>fetchCommonsJson('https://commons.wikimedia.org/w/api.php',{fetchImpl,now:()=>now,sleep:async()=>{assert.fail('shared lane should not retry');}});
for(const [status,body] of [[429,{}],[503,{}],[200,{error:{code:'maxlag'}}],[403,{}]])test('shared HTTP cooldown '+status+' '+JSON.stringify(body),async()=>withState(async p=>{let calls=0;await assert.rejects(request(async()=>{calls++;return new Response(JSON.stringify(body),{status,headers:{'Retry-After':'90000'}});}),CommonsCooldownError);assert.equal(calls,1);const s=await state(p);assert.equal(s.requests.length,1);assert.ok(s.cooldownUntil>=now+86400000);await assert.rejects(request(async()=>assert.fail('provider must remain paused')),CommonsCooldownError);}));
test('missing shared state blocks actual HTTP',async()=>withState(async p=>{await rm(p);await assert.rejects(request(async()=>assert.fail('no network on missing state')));}));
test('shared request records success before HTTP',async()=>withState(async p=>{const response=await request(async()=>{assert.deepEqual((await state(p)).requests,[now]);return new Response(JSON.stringify({query:{pages:[]}}));});assert.deepEqual(response,{query:{pages:[]}});}));
