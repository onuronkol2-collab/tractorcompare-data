import assert from "node:assert/strict";
import {isForumQueueProcessingEnabled} from "./queue-control.ts";
Deno.test("accidental ONAY cannot enable queue without a separate exact Supabase secret",()=>{
 for(const value of [null,undefined,"","ONAY","false","False","TRUE","1","yes","enabled","true "])
  assert.equal(isForumQueueProcessingEnabled(value),false,
   "unexpected activation by "+String(value));
 assert.equal(isForumQueueProcessingEnabled("true"),true);
});
