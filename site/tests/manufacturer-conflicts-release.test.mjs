import test from "node:test";
import assert from "node:assert/strict";
import {auditConflictHtml} from "../scripts/verify-manufacturer-conflicts.mjs";
const issue={markers:["1331","1642"],urls:["https://maker.test/it","https://maker.test/en"]};
const html='<aside role="note" class="model-source-conflict-banner"><p>Italian 1.331 cc; English 1.642 cc</p><a href="https://maker.test/it">Italian</a><a href="https://maker.test/en">English</a></aside>';
test("actual source-linked OEM warning passes",()=>{assert.equal(auditConflictHtml(html,issue),true)});
test("missing banner, wrong sources, incomplete evidence or numbers fail",()=>{
 for(const b of [
  html.replace("model-source-conflict-banner","not-a-warning"),
  html.replace("https://maker.test/it","https://wrong.test/it"),
  html.replace("1.642","missing"),
  html.replace('href="https://maker.test/en"','href="/not-a-source"')
 ])assert.equal(auditConflictHtml(b,issue),false);
});
