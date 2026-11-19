import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";

test("Bing Webmaster owner-verification file exists at static root with the supplied token",()=>{
  const xml=readFileSync(new URL("../public/BingSiteAuth.xml",import.meta.url),"utf8");
  assert.equal(xml.charCodeAt(0),60,"XML must start at first byte (no BOM or HTML wrapper)");
  assert.match(xml,/^<\?xml version="1\.0"\?>/);
  assert.match(xml,/<users>\s*<user>[A-F0-9]{32}<\/user>\s*<\/users>\s*$/);
  assert.equal((xml.match(/<user>/g)||[]).length,1);
  assert.equal(xml.trim().split("<user>")[1].split("</user>")[0],"FB42EB165EC41A66F295C049590F9025");
  const worker=readFileSync(new URL("../worker/index.js",import.meta.url),"utf8");
  assert.match(worker,/env\.ASSETS\.fetch\(request\)/,"Static XML must be served unmodified");
});
