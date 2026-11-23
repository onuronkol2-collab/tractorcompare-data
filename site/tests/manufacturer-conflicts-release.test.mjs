import test from "node:test";
import assert from "node:assert/strict";
import {auditConflictHtml,auditConflictComparisonJson} from "../scripts/verify-manufacturer-conflicts.mjs";
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

test("Başak 4WD source disagreement is fail-closed for both OEM links and both numbers",()=>{
 const case4wd={markers:["3830","3930"],urls:[
  "https://basaktraktor.com.tr/urunler/traktorler/tarla-traktorleri/2075-bk",
  "https://admin.basaktraktor.com.tr/upload/7c743eaf-5228-4ae7-94d7-25df6a13e778-2075%20BK%204WD.pdf"
 ]};
 const example='<aside class="model-source-conflict-banner" role="note"><p>Başak 4WD 3.830 mm / 3.930 mm; same front ballast condition unresolved</p>'+
  case4wd.urls.map(u=>'<a href="'+u+'">OEM evidence</a>').join("")+'</aside>';
 assert.equal(auditConflictHtml(example,case4wd),true);
 for(const broken of [
  example.replace("3.930","unresolved number"),
  example.replace(case4wd.urls[0],"https://untrusted.example/unsupported"),
  example.replace(case4wd.urls[1],"https://untrusted.example/unsupported"),
  example.replace("model-source-conflict-banner","not-conflict")
 ])assert.equal(auditConflictHtml(broken,case4wd),false);
});

test("static comparison release gate rejects disputed length, missing warning and broken JSON",()=>{
 const conflict={markers:["3830","3930"],disputedKeys:["overall_length","overall_length_with_front_ballast_mm"]};
 const good=[
  {key:"wheelbase",value:"2205",unit:"mm",notice:"Başak 2075 BK 4WD: 3.830 mm ve 3.930 mm kaynakları çelişiyor."},
  {key:"rear_lift_capacity",value:"3000",unit:"kg",notice:null}
 ];
 assert.equal(auditConflictComparisonJson(good,conflict),true);
 for(const note of ["Official product page 3,830 mm / brochure 3,930 mm",
  "Page officielle 3 830 mm / brochure 3 930 mm",
  "Produktseite 3.830 mm / Broschüre 3.930 mm"])
  assert.equal(auditConflictComparisonJson([{...good[0],notice:note},good[1]],conflict),true);
 for(const bad of [
  [{key:"overall_length_with_front_ballast_mm",value:"3930" },...good],
  [{key:"overall_length",value:"3830" },...good],
  good.map(row=>({...row,notice:null})),
  good.map(row=>({...row,notice:"Kaynak farkı var, ama rakam yok."})),
  good.filter(row=>row.key!=="wheelbase"),
  {rows:good},null,[],undefined
 ])assert.equal(auditConflictComparisonJson(bad,conflict),false);
});
