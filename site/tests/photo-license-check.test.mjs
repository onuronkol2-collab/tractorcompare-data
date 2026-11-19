import test from "node:test";
import assert from "node:assert/strict";
import {allowedPhotoReuseLicense as allowed} from "../scripts/photo-license-check.mjs";
import {readFileSync} from "node:fs";
test("accepts matching CC BY, CC BY-SA and CC0 metadata when link and name agree",()=>{
  for(const [label,url] of [
    ["CC BY 4.0","https://creativecommons.org/licenses/by/4.0/"],
    ["CC BY-SA 4.0","https://creativecommons.org/licenses/by-sa/4.0"],
    ["CC BY-SA 3.0","https://creativecommons.org/licenses/by-sa/3.0/"],
    ["CC BY 2.0","https://creativecommons.org/licenses/by/2.0/"],
    ["CC BY-SA 4.0","https://creativecommons.org/licenses/by-sa/4.0/deed.en"],
    ["CC0","http://creativecommons.org/publicdomain/zero/1.0/deed.en"],
    ["Public domain","https://creativecommons.org/publicdomain/mark/1.0/"]
  ])assert.equal(allowed(label,url),true,label+" "+url);
});
test("rejects NC, ND, contradictory or absent metadata, external redirects and fake hosts",()=>{
  for(const [label,url] of [
    ["CC BY 4.0","https://creativecommons.org/licenses/by-nc/4.0/"],
    ["CC BY-SA 4.0","https://creativecommons.org/licenses/by-nc-sa/4.0/"],
    ["CC BY 4.0","https://creativecommons.org/licenses/by-nd/4.0/"],
    ["CC BY-SA 4.0","https://creativecommons.org/licenses/by/4.0/"],
    ["CC BY 4.0","https://creativecommons.org/licenses/by-sa/4.0/"],
    ["CC0","https://creativecommons.org/licenses/by/4.0/"],
    ["CC BY-NC 4.0","https://creativecommons.org/licenses/by/4.0/"],
    ["CC BY-ND 4.0","https://creativecommons.org/licenses/by/4.0/"],
    ["CC BY-SA-ND 4.0","https://creativecommons.org/licenses/by-sa/4.0/"],
    ["CC BY",""],
    ["Public domain",""],
    ["All rights reserved","https://creativecommons.org/licenses/by/4.0/"],
    ["CC BY 4.0","javascript:alert(1)"],
    ["CC BY 4.0","https://creativecommons.org.evil.test/licenses/by/4.0/"],
    ["CC BY 4.0","https://evil.test/licenses/by/4.0/"],
    ["CC BY 4.0","https://creativecommons.org@evil.test/licenses/by/4.0/"],
    ["CC BY 4.0","https://creativecommons.org/licenses/by/4.0/extra/"]
  ])assert.equal(allowed(label,url),false,label+" "+url);
});
test("both Commons discovery scripts must use the shared gate, never a looser independent predicate",()=>{
  for(const path of ["scripts/batch-photo-discovery.mjs","scripts/archive-brand-photo-discovery.mjs"]){
    const src=readFileSync(new URL("../site/"+path,import.meta.url).pathname,"utf8");
    assert.match(src,/import\s+\{allowedPhotoReuseLicense\}\s+from\s+"\.\/photo-license-check\.mjs"/);
    assert.match(src,/allowedPhotoReuseLicense\(license,licenseUrl\)/);
  }
});
