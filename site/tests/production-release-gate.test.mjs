import {test} from "node:test";
import assert from "node:assert/strict";
import {resolve} from "node:path";
import {fileURLToPath} from "node:url";
import {verifyProductionConfiguration,verifyProductionArtifacts} from "../scripts/production-release-gate.mjs";
const site=resolve(fileURLToPath(new URL("../",import.meta.url)));
const good={
 SITE_URL:"https://tractorvs.com",
 PUBLIC_INDEXING_ENABLED:"true",
 SUPABASE_URL:"https://projectname.supabase.co",
 SUPABASE_PUBLISHABLE_KEY:"sb_publishable_test_key_example_1234567890",
 WORKERS_CI_BRANCH:"main"
};
test("release gate accepts correctly scoped public production settings",()=>{
 const result=verifyProductionConfiguration(good,site);
 assert.equal(result.origin,"https://tractorvs.com");
 assert.equal(result.worker,"tractorvs-site");
});
test("production build fails closed on missing or unsafe values",()=>{
 for(const key of ["SITE_URL","PUBLIC_INDEXING_ENABLED","SUPABASE_URL","SUPABASE_PUBLISHABLE_KEY"]){
  const env={...good};delete env[key];
  assert.throws(()=>verifyProductionConfiguration(env,site),/TractorVS RELEASE BLOCKED/,key);
 }
 for(const [key,value] of [
  ["SITE_URL","https://tractorvs.example"],
  ["PUBLIC_INDEXING_ENABLED","false"],
  ["SUPABASE_URL","http://projectname.supabase.co"],
  ["SUPABASE_PUBLISHABLE_KEY","sb_secret_example"],
  ["WORKERS_CI_BRANCH","feature/test"],
 ]){
  assert.throws(()=>verifyProductionConfiguration({...good,[key]:value},site),
    /TractorVS RELEASE BLOCKED/,key);
 }
});
test("production build cannot accidentally use the repository root or different app config",()=>{
 assert.throws(()=>verifyProductionConfiguration(good,resolve(site,"..")),
   /TractorVS RELEASE BLOCKED/);
});
test("postbuild release checks fail rather than accept missing or empty publish output",()=>{
 assert.throws(()=>verifyProductionArtifacts({
  dir:resolve(site,"tests/nonexistent-released-site"),
  origin:"https://tractorvs.com",minTractors:100
 }),/TractorVS RELEASE BLOCKED/);
});
