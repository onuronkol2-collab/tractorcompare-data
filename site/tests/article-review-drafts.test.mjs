import test from "node:test";
import {execFileSync} from "node:child_process";
import assert from "node:assert/strict";
import {fileURLToPath} from "node:url";
test("all 24 article review drafts preserve source structure and technical numbers without approving publication",()=>{
 const script=fileURLToPath(new URL("../scripts/verify-article-review-drafts.mjs",import.meta.url));
 const result=JSON.parse(execFileSync(process.execPath,[script],{encoding:"utf8"}));
 assert.equal(result.draftTranslations,24);
 assert.equal(result.bodyParagraphs,272);
 assert.equal(result.uiLabels,192);
 assert.equal(result.glossaryEntries,112);
 assert.equal(result.glossaryFields,448);
 assert.equal(result.structuralChecks,"passed");
 assert.equal(result.publicationApproved,false);
});
