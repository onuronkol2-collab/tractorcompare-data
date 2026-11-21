// Verify actual built HTML, not just component source order.
// Astro may transform script tags while compiling; these six data scripts
// must remain inside <body> across all ten public languages.
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {resolve} from "node:path";

const locales=["en","tr","zh","hi","pt-br","fr","de","ru","ja","es"];
const targets={
 "index.html":["home-suggestions-data","home-suggestions-i18n"],
 "tractors/index.html":["catalog-price-payload"],
 "compare/index.html":["tc-payload","tc-i18n"],
 "farm-advisor/index.html":["advisor-data"],
};
let checked=0;
for(const locale of locales){
 for(const [page,ids] of Object.entries(targets)){
  const prefix=locale==="en"?"":locale+"/";
  const file=resolve("site/dist",prefix+page);
  const html=readFileSync(file,"utf8");
  const bodyStart=html.search(/<body\b/i);
  const bodyEnd=html.lastIndexOf("</body>");
  const htmlEnd=html.lastIndexOf("</html>");
  assert.ok(bodyStart>=0&&bodyEnd>bodyStart&&htmlEnd>bodyEnd,
   "Missing normal HTML document boundaries: "+file);
  for(const id of ids){
   const hits=[...html.matchAll(new RegExp("<script\\b[^>]*\\bid=[\\\"']"+id+"[\\\"'][^>]*>", "gi"))];
   assert.equal(hits.length,1,id+" must be rendered exactly once: "+file);
   const pos=hits[0].index;
   const tag=hits[0][0];
   assert.ok(pos>bodyStart&&pos<bodyEnd,id+" is not inside <body>: "+file);
   assert.match(tag,/type=[\"']application\/json[\"']/i,
    id+" changed away from inert JSON");
  }
  assert.ok(html.slice(htmlEnd+7).trim()==="",
   "Unexpected emitted HTML after closing document: "+file);
  checked++;
 }
}
console.log("DOCUMENT_JSON_BOUNDARIES_PASS "+JSON.stringify({locales:locales.length,documents:checked,dataFieldsPerLocale:6}));
