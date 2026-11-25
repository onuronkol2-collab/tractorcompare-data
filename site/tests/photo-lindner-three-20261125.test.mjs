import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {createHash} from "node:crypto";
const evidence=JSON.parse(readFileSync(new URL("../docs/photo-evidence-lindner-three-20261125.json",import.meta.url),"utf8"));
const registry=readFileSync(new URL("../src/lib/historical-licensed-photos.ts",import.meta.url),"utf8");
test("three reviewed Lindner photos, exactly two public model identities and nine original-derived JPEGs",()=>{
assert.equal(evidence.length,3);assert.equal(new Set(evidence.map(p=>p.tractorId)).size,2);
for(const p of evidence){assert.equal(p.license,"CC BY-SA 4.0");assert.equal(p.photographer,"MarcelX42");assert.match(p.originalSha256,/^[a-f0-9]{64}$/);assert.equal(p.derivatives.length,3);assert.ok(registry.includes(JSON.stringify({brand:p.brand,model:p.model,tractorId:p.tractorId,fileId:p.fileId,path:p.path,photographer:p.photographer,license:p.license,width:p.width,height:p.height,resizedDerivative:true})));for(const d of p.derivatives){const b=readFileSync(new URL("../public/images/tractors/"+d.file,import.meta.url));assert.equal(b.length,d.bytes);assert.equal(createHash("sha256").update(b).digest("hex"),d.sha256);assert.equal(b[0],255);assert.equal(b[1],216);assert.ok(d.width<=p.width);}}
});
