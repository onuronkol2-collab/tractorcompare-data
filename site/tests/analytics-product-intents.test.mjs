import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {PRODUCT_ACTION_EVENTS, ADVISOR_CALCULATION_DONE_EVENT}
  from "../src/lib/analytics-product-actions.ts";

const component=(name)=>readFileSync(new URL("../src/components/"+name+".astro",import.meta.url),"utf8");

test("product-action events use only non-identifying names",()=>{
 assert.deepEqual(PRODUCT_ACTION_EVENTS,{
  compareLaunch:"tractor_compare_launch",
  advisorCalculated:"tractor_advisor_calculated",
  farmToolCalculated:"tractor_farm_tool_calculated"
 });
 for(const value of Object.values(PRODUCT_ACTION_EVENTS)){
  assert.match(value,/^[a-z][a-z0-9_]{0,39}$/);
 }
 assert.equal(ADVISOR_CALCULATION_DONE_EVENT,"tractorvs:advisor-calculation-complete");
});

test("product actions are sent only after stored consent and GA4 tag initialization",()=>{
 const source=component("AnalyticsConsent");
 assert.match(source,/import \{ PRODUCT_ACTION_EVENTS, ADVISOR_CALCULATION_DONE_EVENT \} from "\.\.\/lib\/analytics-product-actions"/);
 const start=source.indexOf("function trackAnonymousAction(");
 const end=source.indexOf('accept?.addEventListener("click"',start);
 assert.ok(start>=0&&end>start);
 const actions=source.slice(start,end);
 assert.match(actions,/storedChoice\(\) !== "accepted"/);
 assert.match(actions,/document\.querySelector\("script\[data-tractorvs-ga4\]"\)/);
 assert.match(actions,/analyticsWindow\.gtag\?\.\("event", name\)/);
 assert.match(actions,/target\.id === "catalog-compare"/);
 assert.match(actions,/trackAnonymousAction\(PRODUCT_ACTION_EVENTS\.compareLaunch\)/);
 assert.match(actions,/window\.addEventListener\(ADVISOR_CALCULATION_DONE_EVENT/);
 assert.match(actions,/trackAnonymousAction\(PRODUCT_ACTION_EVENTS\.advisorCalculated\)/);
 assert.doesNotMatch(actions,/FormData|\.value|tractor_id|model_name|searchTerm|searchQuery/);
});

test("advisor emits success signal only after validated results render",()=>{
 const source=component("FarmAdvisor");
 assert.match(source,/import \{ ADVISOR_CALCULATION_DONE_EVENT \} from "\.\.\/lib\/analytics-product-actions"/);
 const submit=source.indexOf('form.addEventListener("submit"');
 const valid=source.indexOf('if(!form.reportValidity()) return;',submit);
 const recommended=source.indexOf("recommendTractors(payload.published,input,5)",valid);
 const shown=source.indexOf("results.hidden=false;",recommended);
 const dispatch=source.indexOf("window.dispatchEvent(new Event(ADVISOR_CALCULATION_DONE_EVENT));",shown);
 const failed=source.indexOf("} catch {",shown);
 assert.ok(submit>=0&&valid>submit&&recommended>valid&&shown>recommended);
 assert.ok(dispatch>shown&&failed>dispatch);
 assert.equal(source.match(/dispatchEvent\(new Event\(ADVISOR_CALCULATION_DONE_EVENT\)\)/g)?.length,1);
});

test("farm calculator telemetry has a single allowlisted anonymous event and uses the consent gate",()=>{const source=component("AnalyticsConsent");assert.match(source,/window\.addEventListener\(FARM_TOOL_DONE_EVENT, \(\) => \{trackAnonymousAction\(PRODUCT_ACTION_EVENTS\.farmToolCalculated\)/);});
