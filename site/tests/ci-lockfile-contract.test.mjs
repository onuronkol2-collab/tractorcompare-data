import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {verifyDependencyContract,verifyWorkerRouteContract} from '../scripts/ci-lockfile-contract.mjs';
const sample=()=>{
 const sitePkg={name:'tractorvs-site',dependencies:{astro:'7.4.12','@astrojs/sitemap':'3.7.6'},devDependencies:{wrangler:'4.162.0'}};
 const nodes=Object.fromEntries(Object.entries({...sitePkg.dependencies,...sitePkg.devDependencies}).map(([n,v])=>['node_modules/'+n,{version:v,integrity:'sha512-fixture'}]));
 return {sitePkg,repoLock:{packages:{site:structuredClone(sitePkg),...structuredClone(nodes)}},siteLock:{packages:{'':structuredClone(sitePkg),...structuredClone(nodes)}}};
};
test('both locked roots agree with the pinned direct dependencies',()=>assert.doesNotThrow(()=>verifyDependencyContract(sample())));
test('a bumped root Astro resolution cannot pass preflight',()=>{const x=sample();x.repoLock.packages['node_modules/astro'].version='7.4.13';assert.throws(()=>verifyDependencyContract(x),/resolution\/integrity drift: astro/)});
test('a stale site manifest or removed integrity cannot pass',()=>{const x=sample();x.siteLock.packages[''].dependencies.astro='7.4.13';assert.throws(()=>verifyDependencyContract(x),/manifest\/lock mismatch/);const y=sample();delete y.siteLock.packages['node_modules/@astrojs/sitemap'].integrity;assert.throws(()=>verifyDependencyContract(y),/resolution\/integrity drift/)});
test('a new dependency cannot silently bypass either lockfile',()=>{const x=sample();x.sitePkg.dependencies.extra='1.0.0';assert.throws(()=>verifyDependencyContract(x),/inventory drift/)});
test('nested direct resolution is rejected rather than hidden by the root lock',()=>{const x=sample();x.repoLock.packages['site/node_modules/astro']={version:'7.4.13'};assert.throws(()=>verifyDependencyContract(x),/nested workspace resolution/)});
const routes=()=>({assets:{run_worker_first:['/language/*','/api/visitor-country','/sitemap.xml','/images/tractors/*']}});
test('both Worker configs require sitemap routing and identical ordered rules',()=>{const x=routes(),y=routes();assert.doesNotThrow(()=>verifyWorkerRouteContract(x,y));y.assets.run_worker_first.splice(2,1);assert.throws(()=>verifyWorkerRouteContract(x,y),/misses \/sitemap.xml/);const z=routes();z.assets.run_worker_first.reverse();assert.throws(()=>verifyWorkerRouteContract(x,z),/parity drift/)});
test('duplicate and catch-all Worker rules cannot pass',()=>{const x=routes(),y=routes();y.assets.run_worker_first.push('/');assert.throws(()=>verifyWorkerRouteContract(x,y),/canonical root/);y.assets.run_worker_first.pop();y.assets.run_worker_first.push('/sitemap.xml');assert.throws(()=>verifyWorkerRouteContract(x,y),/duplicate/)});
test('all three existing CI paths fail early before dependencies or browser installation',()=>{for(const f of ['site-build.yml','playwright-accessibility.yml','tractorvs-production-release-check.yml']){const s=readFileSync(new URL('../../.github/workflows/'+f,import.meta.url),'utf8');const guard=s.indexOf('run: node site/scripts/verify-cloudflare-build-contract.mjs');assert.ok(guard>=0,f);assert.ok(guard<s.indexOf('run: npm ci'),f);assert.ok(s.includes('"package-lock.json"'),f);assert.ok(s.includes('"site/package-lock.json"'),f)}});
