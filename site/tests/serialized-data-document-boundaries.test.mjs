import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";

// Astro component JSON script tags are not a reason to place content after the
// document shell's closing </html>. Keep data payloads inside SiteLayout.
const components={
  "TractorCatalog.astro":["catalog-price-payload"],
  "TractorComparison.astro":["tc-payload","tc-i18n"],
  "FarmAdvisor.astro":["advisor-data"],
  "HomeExperience.astro":["home-suggestions-data","home-suggestions-i18n"],
};

for(const [file,ids] of Object.entries(components)){
  test(file+" keeps executable-data JSON inside the page body",()=>{
    const src=readFileSync(new URL("../src/components/"+file,import.meta.url),"utf8");
    const open=src.indexOf("<SiteLayout ");
    const close=src.lastIndexOf("</SiteLayout>");
    assert.ok(open>=0 && close>open,"Component needs its document layout");
    const inside=src.slice(open,close);
    const outside=src.slice(close+"</SiteLayout>".length);
    const scripts=[...inside.matchAll(/<script\s+type="application\/json"\s+id="([^"]+)"\s+set:html=\{[\s\S]*?<\/script>/g)];
    assert.deepEqual(scripts.map(m=>m[1]),ids,"Document payload IDs must stay stable and ordered");
    assert.doesNotMatch(outside,/<script\s+type="application\/json"/,
      "Raw JSON appended after the layout could render after closing HTML");
    for(const id of ids){
      assert.ok(src.includes('getElementById("'+id+'")')||
        src.includes('querySelector<HTMLScriptElement>("#'+id+'")')||
        src.includes('querySelector("#'+id+'")'),
      "Browser code should still use the original ID "+id);
    }
  });
}
