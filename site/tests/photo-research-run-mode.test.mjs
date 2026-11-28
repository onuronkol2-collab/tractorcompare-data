import test from 'node:test';
import assert from 'node:assert/strict';
import {resolveResearchMode} from '../scripts/photo-research-run-mode.mjs';
const budget = cooldownUntil => ({version:1,provider:'commons',requests:[],cooldownUntil});
const run = (event,requested,cooldownUntil,now=100) => resolveResearchMode({event,requested,budget:budget(cooldownUntil),now});
test('schedule defaults to research only after cooldown',()=>{
 assert.equal(run('schedule','',100),'research');
 assert.equal(run('schedule','',99),'research');
 assert.equal(run('schedule','',101),'deferred');
});
test('manual restore and bootstrap do not become research',()=>{
 assert.equal(run('workflow_dispatch','restore',200),'restore');
 assert.equal(run('workflow_dispatch','bootstrap',200),'bootstrap');
 assert.equal(run('workflow_dispatch','research',200),'deferred');
 assert.equal(run('workflow_dispatch','research',100),'research');
});
test('unknown modes and unexpected triggers fail closed',()=>{
 for(const [event,mode] of [['push','research'],['schedule','bootstrap'],['workflow_dispatch',''],['workflow_dispatch','invalid']]) assert.throws(()=>run(event,mode,0));
 assert.throws(()=>run('schedule','',0,-1));
 assert.throws(()=>resolveResearchMode({event:'schedule',budget:{version:1},now:100}));
 assert.throws(()=>resolveResearchMode({event:'schedule',budget:{...budget(0),requests:[101]},now:100}));
});
