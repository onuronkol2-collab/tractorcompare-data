import test from "node:test";
import assert from "node:assert/strict";
import {requireCommonsQueryResponse} from "../scripts/photo-source-response.mjs";
test("Commons successful file search and valid no-result response remain allowed",()=>{
  const a={batchcomplete:true,query:{pages:[{title:"File:Tractor.jpg"}]}};
  assert.equal(requireCommonsQueryResponse(a),a);
  assert.deepEqual(requireCommonsQueryResponse({batchcomplete:true}),{batchcomplete:true});
});
test("Commons API logical HTTP 200 error cannot look like zero image candidates",()=>{
  assert.throws(()=>requireCommonsQueryResponse({error:{code:"ratelimited",info:"Retry later"}}),/ratelimited/);
  assert.throws(()=>requireCommonsQueryResponse({error:{code:"permissiondenied"}}),/permissiondenied/);
});
test("null, array or other invalid API JSON shapes fail safely",()=>{
  for(const x of [null,[],false,"unexpected"])assert.throws(()=>requireCommonsQueryResponse(x),/invalid JSON response/);
});
