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
test("both brand source and published candidate reuse share the conservative licence gate",()=>{
  const archive=readFileSync(new URL("../scripts/archive-brand-photo-discovery.mjs",import.meta.url),"utf8");
  const candidateIndex=readFileSync(new URL("../scripts/photo-archive-candidate-index.mjs",import.meta.url),"utf8");
  const published=readFileSync(new URL("../scripts/batch-photo-discovery.mjs",import.meta.url),"utf8");
  assert.match(archive,/import\s+\{allowedPhotoReuseLicense\}\s+from\s+"\.\/photo-license-check\.mjs"/);
  assert.match(archive,/allowedPhotoReuseLicense\(license,licenseUrl\)/);
  assert.match(candidateIndex,/import\s+\{allowedPhotoReuseLicense\}\s+from\s+"\.\/photo-license-check\.mjs"/);
  assert.match(candidateIndex,/allowedPhotoReuseLicense\(p\.license,p\.licenseUrl\)/);
  assert.match(published,/archiveCandidatesForModel\(archiveIndex,entry\)/);
});
