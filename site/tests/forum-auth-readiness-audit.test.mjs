import test from "node:test";
import assert from "node:assert/strict";
import {assessAuthPublicSettings,checkAuthSettings} from "../scripts/forum-auth-readiness-audit.mjs";

test("email enabled and signup allowed is valid; social providers are reported not presumed",()=>{
 const x=assessAuthPublicSettings({disable_signup:false,external:{email:true,google:false,github:false}});
 assert.equal(x.passed,true);
 assert.deepEqual(x.providers,{email:true,google:false,github:false});
});
test("blocked email registrations and incomplete responses never pass",()=>{
 for(const data of [
   {disable_signup:true,external:{email:true}},
   {disable_signup:false,external:{email:false}},
   {external:{email:true}},
   {disable_signup:false},
 ])assert.equal(assessAuthPublicSettings(data).passed,false);
});
test("queries public settings with only anon apikey and no mutation",async()=>{
 const r=await checkAuthSettings({anonKey:"fake-public-key",fetchFn:async(url,opts)=>{
   assert.equal(new URL(url).pathname,"/auth/v1/settings");
   assert.deepEqual(Object.keys(opts.headers).sort(),["Accept","apikey"]);
   assert.equal(opts.redirect,"error");
   return new Response(JSON.stringify({
     disable_signup:false,external:{email:true,github:false,google:true}
   }),{status:200});
 }});
 assert.equal(r.passed,true);
 assert.equal(r.providers.github,false);
 assert.equal(r.providers.google,true);
});
test("network errors and malformed auth settings do not become fabricated success",async()=>{
 assert.equal((await checkAuthSettings({anonKey:"fake",fetchFn:async()=>new Response("no",{status:503})})).passed,false);
 await assert.rejects(checkAuthSettings({anonKey:""}),/key unavailable/);
});
