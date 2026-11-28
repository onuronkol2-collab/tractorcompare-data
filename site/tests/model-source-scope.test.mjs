import test from "node:test";
import assert from "node:assert/strict";
import {LOCALES} from "../src/lib/locales.ts";
import {SOURCE_SCOPE_COPY,sourceScopeText} from "../src/lib/model-source-scope.ts";
test("source scope is explicit in all ten locales and distinguishes total URLs from listed links",()=>{
 const sources={totalDocuments:13,manufacturerDocuments:9,independentDocuments:4,remainingDocuments:5,documents:Array(8).fill({})};
 assert.deepEqual(Object.keys(SOURCE_SCOPE_COPY).sort(),[...LOCALES].sort());
 for(const lang of LOCALES){
  const result=sourceScopeText("Fixture 75",sources,lang), n=new Intl.NumberFormat(lang);
  assert.ok(result.summary.includes("Fixture 75"));
  for(const v of [13,9,4])assert.ok(result.summary.includes(n.format(v)),lang+":"+v);
  assert.ok(result.scope.includes(n.format(8)));
  assert.doesNotMatch(result.summary+result.scope,/\{(?:model|total|official|independent|shown)\}/);
  assert.equal(sourceScopeText("Fixture",{...sources,remainingDocuments:0,documents:Array(13).fill({})},lang).scope,null);
 }
 assert.ok(sourceScopeText("Fixture {total}",sources,"en").summary.includes("Fixture {total}"));
});
