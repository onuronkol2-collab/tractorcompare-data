import test from "node:test";
import assert from "node:assert/strict";
import {comparePerformance} from "../scripts/ci-performance-regression.mjs";
import {compareBrowserInventory} from "../scripts/browser-duration-evidence.mjs";
const sample=(id,ms,extra={})=>({id,scope:"browser",environment:"webkit-ubuntu-24.04",inventory:"same-tests",data:"same-fixture",success:true,flaky:0,skipped:5,metrics:{wallMs:ms},...extra});
test("regression comparisons require three equivalent successful distinct observations on each side",()=>{
 const baseline=[sample("a",100),sample("b",110),sample("c",120)];
 const candidate=[sample("d",70),sample("e",80),sample("f",90)];
 assert.equal(comparePerformance({baseline,candidate,metric:"wallMs"}).status,"improvement");
 assert.equal(comparePerformance({baseline,candidate:candidate.map(r=>({...r,metrics:{wallMs:150}})),metric:"wallMs"}).status,"regression");
 assert.equal(comparePerformance({baseline,candidate:candidate.slice(0,2),metric:"wallMs"}).status,"insufficient-samples");
 assert.equal(comparePerformance({baseline,candidate:[...candidate.slice(0,2),sample("f",80,{inventory:"different"})],metric:"wallMs"}).status,"incomparable");
 assert.equal(comparePerformance({baseline,candidate:[...candidate.slice(0,2),sample("f",80,{skipped:6})],metric:"wallMs"}).status,"incomparable");
});
test("inventory proves exact IDs and file mapping, not just equal counts",()=>{
 const headSha="a".repeat(40),project="webkit",file="e2e/a.spec.mjs";
 const parts=[{version:1,runId:2,attempt:1,headSha,project,index:1,total:2,successful:true,cases:[{id:"id1",file,ms:100,status:"passed"}]},{version:1,runId:2,attempt:1,headSha,project,index:2,total:2,successful:true,cases:[{id:"id2",file,ms:100,status:"skipped"}]}];
 const args={inventory:[{id:"id1",file},{id:"id2",file}],parts,headSha,project};
 assert.equal(compareBrowserInventory(args).complete,true);
 const missing=compareBrowserInventory({...args,inventory:[{id:"id1",file},{id:"id3",file}]});
 assert.equal(missing.complete,false);assert.deepEqual(missing.missing,["id3"]);assert.deepEqual(missing.extra,["id2"]);
 assert.equal(compareBrowserInventory({...args,inventory:[{id:"id1",file},{id:"id2",file:"e2e/b.spec.mjs"}]}).complete,false);
 assert.throws(()=>compareBrowserInventory({...args,headSha:"b".repeat(40)}),/mismatch/);
});
