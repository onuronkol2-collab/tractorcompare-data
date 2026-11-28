import test from 'node:test';import assert from 'node:assert/strict';import {currentLeads,collect} from '../scripts/photo-commons-collect.mjs';
const id='cb89989e-50a6-4109-9614-3384b1b55c6e',source='https://commons.wikimedia.org/wiki/File:Fixture.jpg';
const c={missing:1,missing_models:[{brand:'Steyr',model:'4115',missingTractorIds:[id]}]};const l={candidates:[{brand:'Steyr',model:'4115',source,tractorIds:[id]}],preservedRejectionsAndHolds:[]};const state=()=>({version:1,cooldownUntil:0,files:{}});const opts={now:()=>1000,delay:async()=>{}};
test('current UUID only',()=>assert.equal(currentLeads(c,l).length,1));
test('covered UUID excluded',()=>assert.equal(currentLeads({missing:0,missing_models:[]},l).length,0));
test('hold excluded',()=>assert.equal(currentLeads(c,{...l,preservedRejectionsAndHolds:[{source}]}).length,0));
test('incomplete coverage rejected',()=>assert.throws(()=>currentLeads({...c,missing:2},l)));
test('metadata cannot approve publication',async()=>{const r=await collect(c,l,state(),{...opts,fetchJSON:async()=>({query:{pages:[{title:'File:Fixture.jpg',imageinfo:[{}]}]}})});assert.equal(r.packets.length,1);assert.equal(r.packets[0].publicationAuthorized,false);});
test('cooldown persisted and not retried',async()=>{const r=await collect(c,l,state(),{...opts,fetchJSON:async()=>{throw Object.assign(new Error('429'),{name:'CommonsCooldownError',retryMs:200000000});}});assert.equal(r.state.cooldownUntil,200001000);const s=await collect(c,l,r.state,{...opts,fetchJSON:async()=>{throw Error('must not run')}});assert.equal(s.status,'cooldown');});
test('metadata mismatch held',async()=>{const r=await collect(c,l,state(),{...opts,fetchJSON:async()=>({query:{pages:[{title:'File:Other.jpg',imageinfo:[{}]}]}})});assert.equal(r.packets.length,0);assert.equal(r.outcomes[0].status,'retryable');});

test('cached packet survives checkpoint without API request',async()=>{const r=await collect(c,l,state(),{...opts,fetchJSON:async()=>({query:{pages:[{title:'File:Fixture.jpg',imageinfo:[{}]}]}})});const s=await collect(c,l,r.state,{...opts,fetchJSON:async()=>{throw Error('must not fetch')}});assert.equal(s.packets.length,1);assert.equal(s.packets[0].cached,true);});
