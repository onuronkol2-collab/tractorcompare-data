import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";

const script=readFileSync(new URL("../scripts/stage-reviewed-commons-20261122.py",import.meta.url),"utf8");

test("Wikimedia JPEG importer compares real SOI/EOI bytes, not backslash text",()=>{
  assert.match(script,/raw\[:3\] == b"\\xff\\xd8\\xff"/);
  assert.match(script,/raw\[-2:\] == b"\\xff\\xd9"/);
  assert.match(script,/data\[:3\] != b"\\xff\\xd8\\xff"/);
  assert.match(script,/data\[-2:\] != b"\\xff\\xd9"/);
  assert.doesNotMatch(script,/b"\\\\xff/,"Double-escaped JPEG magic is not valid JPEG");
});

test("Importer remains review-only with fixed approved source identities and SHA evidence",()=>{
  assert.match(script,/approvedToPublish": False/);
  assert.match(script,/publicationCount": 0/);
  assert.match(script,/sha256-ledger\.json/);
  assert.match(script,/if response\.geturl\(\) != url/);
  assert.match(script,/HTTPError/);
  assert.match(script,/no automatic retry or fallback/);
  assert.match(script,/output-dir/);
  assert.doesNotMatch(script,/subprocess\.|os\.system/);
});
