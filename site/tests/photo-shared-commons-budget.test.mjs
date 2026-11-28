import test from 'node:test';import assert from 'node:assert/strict';
import {initialBudget,reserveBudget,pauseBudget} from '../scripts/photo-shared-commons-budget.mjs';
const now=200000000;
test('all caller phases consume same rolling window',()=>{const a=reserveBudget(initialBudget(),now,1);assert.equal(a.allowed,true);assert.equal(reserveBudget(a.state,now+1,1).allowed,false);});
test('old reservation expires after 24 hours',()=>{const a=reserveBudget(initialBudget(),now,1);assert.equal(reserveBudget(a.state,now+86400000,1).allowed,true);});
test('cooldown is not shortened by later callers',()=>{const s=pauseBudget(initialBudget(),now,50000);assert.equal(pauseBudget(s,now,1000).cooldownUntil,now+50000);assert.equal(reserveBudget(s,now+1).allowed,false);});
test('invalid state and clock rollback fail closed',()=>{assert.throws(()=>reserveBudget({},now));assert.throws(()=>reserveBudget({...initialBudget(),requests:[now+1]},now));});
