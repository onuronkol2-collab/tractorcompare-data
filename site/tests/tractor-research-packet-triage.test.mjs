import test from "node:test";
import assert from "node:assert/strict";
import {triageResearchPacket,triageResearchPackets} from "../../scripts/tractor-research-packet-triage.mjs";
const spec={name:"rear_lift_capacity",value:"2300",unit:"kg",locator:"table",context:"at link ends"};
const model={brand:"Fixture",model:"F1",variant:"A",market:"Test",sourceUrl:"https://example.org/specs",sourceType:"manufacturer",disposition:"hold_for_review",specs:[spec]};
const packet=models=>({schema:"tractorvs-research-evidence-v1",status:"research_only_not_importable",models});
test("research triage never authorizes publication and preserves distinct measurement contexts",()=>{
 const result=triageResearchPacket(packet([{...model,specs:[spec,{...spec,value:"1800",context:"610 mm behind"}]}]));
 assert.equal(result.allowedToPublish,false);
 assert.equal(result.publicationCount,0);
 assert.equal(result.observations,2);
 assert.ok(!result.rows[0].reasons.includes("conflicting_observation"));
});
test("detects conflicts and rejects sparse, malformed or promoted data",()=>{
 const result=triageResearchPacket(packet([{...model,specs:[spec,{...spec,value:"1800"}]}]));
 assert.ok(result.rows[0].reasons.includes("conflicting_observation"));
 assert.throws(()=>triageResearchPacket(packet(Array(2))));
 assert.throws(()=>triageResearchPacket(packet([{...model,specs:Array(2)}])));
 assert.throws(()=>triageResearchPacket(packet([{...model,disposition:"approved"}])));
 assert.throws(()=>triageResearchPacket(packet([{...model,sourceUrl:"https://u:p@example.org/"}])));
});

test("cross-packet identity and UUID collisions remain held",()=>{
 const id="abcdefab-1234-1234-1234-abcdefabcdef";
 const a=packet([{...model,existingDraftId:id}]);
 const b=packet([{...model,existingDraftId:id.toUpperCase()}]);
 const result=triageResearchPackets([a,b]);
 assert.equal(result.models,2);
 assert.ok(result.rows[1].reasons.includes("repeated_identity"));
 assert.ok(result.rows[1].reasons.includes("repeated_draft_reference"));
 assert.equal(result.allowedToPublish,false);
 assert.throws(()=>triageResearchPackets([a,,b]));
});
