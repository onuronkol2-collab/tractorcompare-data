import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { isInfolinksRoute, isInfolinksAllowed, INFOLINKS_PID, INFOLINKS_WSID, INFOLINKS_SRC, AD_CHOICE_KEY } from '../src/lib/infolinks-policy.mjs';
test('only canonical tractor detail routes',()=>{
 assert.equal(isInfolinksRoute('/tractors/john-deere-5075e/'),true);
 for(const p of ['/','/tractors/','/compare/','/forum/','/privacy/','/login/','/tractors/foo/bar/','/404/','/tractors/../','/tractors/foo/?q=1','/tractors/Foo/']) assert.equal(isInfolinksRoute(p),false,p);
});
test('fail closed without explicit consent, on preview and URL state',()=>{
 const base={enabled:true,origin:'https://tractorvs.com',eligible:true,search:'',hash:'',choice:'accepted'};
 assert.equal(isInfolinksAllowed(base),true);
 for(const override of [{enabled:false},{origin:'https://preview.workers.dev'},{eligible:false},{search:'?q=test'},{hash:'#access_token=x'},{choice:null},{choice:'rejected'},{choice:'analytics-accepted'},{enabled:'true'},{eligible:1},{choice:undefined}]) assert.equal(isInfolinksAllowed({...base,...override}),false);
});
test('correct publisher, separate preference',()=>{
 assert.equal(INFOLINKS_PID,3450022);assert.equal(INFOLINKS_WSID,0);
 assert.equal(INFOLINKS_SRC,'https://resources.infolinks.com/js/infolinks_main.js');
 assert.notEqual(AD_CHOICE_KEY,'tractorvs_analytics_choice_v3');
});
test('document consent not persisted or restored',()=>{
 const source=readFileSync(new URL('../src/components/InfolinksConsent.astro',import.meta.url),'utf8');
 assert.match(source,/let currentChoice: Choice \| null = null/);
 assert.doesNotMatch(source,/localStorage\.getItem|setItem\(AD_CHOICE_KEY,\s*choice\)/);
 assert.match(source,/if \(event.persisted\) denyAndReload/);
});
test('production onboarding metadata is inert; no ad component mounted',()=>{
 const layout=readFileSync(new URL('../src/layouts/SiteLayout.astro',import.meta.url),'utf8');
 assert.match(layout,/name="google-adsense-account"/);
 assert.doesNotMatch(layout,/import InfolinksConsent|<InfolinksConsent|PUBLIC_INFOLINKS_ENABLED/);
 assert.match(layout,/indexingEnabled && Astro\.site\?\.origin === "https:\/\/tractorvs\.com" && \(plainPath === "\/" \|\| isInfolinksRoute\(plainPath\)\)/);
 const block=layout.match(/<script is:inline type="application\/json" id="tractorvs-infolinks-pending">([^<]+)<\/script>/);
 assert.ok(block);
 assert.deepEqual(JSON.parse(block[1]),{infolinks_pid:INFOLINKS_PID,infolinks_wsid:INFOLINKS_WSID,script:INFOLINKS_SRC,status:'pending-inactive'});
});
