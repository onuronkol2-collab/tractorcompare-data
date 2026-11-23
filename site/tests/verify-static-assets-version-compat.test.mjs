import {test} from "node:test";
import assert from "node:assert/strict";
import {mkdtempSync,mkdirSync,writeFileSync,rmSync,symlinkSync} from "node:fs";
import {tmpdir} from "node:os";
import {join,dirname} from "node:path";
import {
 extractAstroReferences,auditBuiltAstroAssets,compareBuiltAssetVersions
} from "../scripts/verify-static-assets-version-compat.mjs";

function site({name="old",javascript="app.old12345.js",css="site.old12345.css",font="font.old12345.woff2",includeAssets=true}={}){
 const dir=mkdtempSync(join(tmpdir(),"tractorvs-static-version-"+name+"-"));
 const write=(path,content)=>{const p=join(dir,path);mkdirSync(dirname(p),{recursive:true});writeFileSync(p,content);};
 write("index.html",'<html><head><link rel="stylesheet" href="/_astro/'+css+
 '"></head><body><script type="module" src="/_astro/'+javascript+'"></script></body></html>');
 write("tr/tractors/index.html",'<html><head><link rel="modulepreload" href="/_astro/'+javascript+
 '"></head><body><a href="/tr/tractors/test-model/">Model</a></body></html>');
 if(includeAssets){
  write("_astro/"+javascript,"export const ready=true;");
  write("_astro/"+css,':root{font-family:"Test"}\n@font-face{src:url("/_astro/'+font+'");}');
  write("_astro/"+font,"test-font-binary");
 }
 return {dir,write,dispose:()=>rmSync(dir,{recursive:true,force:true})};
}
test("recognizes only first-party /_astro generated JS CSS font references",()=>{
 const source='src="/_astro/app.a1b2c3.js" href="/_astro/style.x5y6z7.css?v=2" '+
  'url("/_astro/real.woff2") src="https://foreign.example/_astro/external.js"';
 assert.deepEqual(extractAstroReferences(source),[
  "/_astro/app.a1b2c3.js","/_astro/real.woff2","/_astro/style.x5y6z7.css"]);
});
test("scan checks HTML and CSS asset references without touching model URLs or noindex",()=>{
 const f=site();
 try{
  const r=auditBuiltAstroAssets(f.dir);
  assert.equal(r.htmlDocuments,2);
  assert.equal(r.dependencyDocuments,2);
  assert.equal(r.assetFiles,3);
  assert.equal(r.referenceCount,3);
  assert.deepEqual(r.missingReferences,[]);
  assert.deepEqual(r.assetPaths,[
   "/_astro/app.old12345.js","/_astro/font.old12345.woff2","/_astro/site.old12345.css"
  ]);
  assert.match(r.state,/local_build_output_only/);
 }finally{f.dispose();}
});
test("missing emitted JS, CSS and CSS-dependent fonts are never silently accepted",()=>{
 const f=site();
 try{
  f.write("tr/tractors/index.html",'<script src="/_astro/missing.unknown123.js"></script>');
  const report=auditBuiltAstroAssets(f.dir);
  assert.deepEqual(report.missingReferences,[
   {asset:"/_astro/missing.unknown123.js",referencedBy:"tr/tractors/index.html"}
  ]);
 }finally{f.dispose();}
});
test("version skew audit reports both old-tab and reverse rollback missing assets",()=>{
 const old=site({name:"a"}),newer=site({name:"b",javascript:"app.new12345.js",css:"site.new12345.css",font:"font.new12345.woff2"});
 try{
  const risk=compareBuiltAssetVersions(old.dir,newer.dir);
  assert.equal(risk.oldAssetPathsAbsentFromNew,3);
  assert.equal(risk.newAssetPathsAbsentFromOld,3);
  assert.equal(risk.oldHtmlAndModuleReferencesAbsentFromNew,3);
  assert.equal(risk.newHtmlAndModuleReferencesAbsentFromOld,3);
  assert.equal(risk.status,"POTENTIAL_VERSION_SKEW");
  // Built bundles alone never tell us what Cloudflare actually deployed.
  assert.match(risk.interpretation,/not proof of Cloudflare/);
 }finally{old.dispose();newer.dispose();}
});
test("keeping older hashed assets removes old-tab risk but not reverse-deployment propagation",()=>{
 const old=site({name:"a"}),newer=site({name:"b",javascript:"app.new12345.js",css:"site.new12345.css",font:"font.new12345.woff2"});
 try{
  for(const p of ["app.old12345.js","site.old12345.css","font.old12345.woff2"]){
   const content=p.endsWith(".css")?'@font-face{src:url("/_astro/font.old12345.woff2")}':"old version asset";
   newer.write("_astro/"+p,content);
  }
  const report=compareBuiltAssetVersions(old.dir,newer.dir);
  assert.equal(report.oldAssetPathsAbsentFromNew,0);
  assert.ok(report.newAssetPathsAbsentFromOld>0);
  assert.equal(report.status,"POTENTIAL_VERSION_SKEW");
 }finally{old.dispose();newer.dispose();}
});
test("unsafe dot-segment asset paths and symlinks are rejected",()=>{
 assert.throws(()=>extractAstroReferences('src="/_astro/../secret.svg"'),/Unsafe Astro asset/);
 const f=site();
 try{
  symlinkSync(join(f.dir,"_astro","app.old12345.js"),join(f.dir,"_astro","link.js"));
  assert.throws(()=>auditBuiltAstroAssets(f.dir),/symlink/);
 }finally{f.dispose();}
});
test("missing dist and missing index.html cannot masquerade as a passing build",()=>{
 const f=site({includeAssets:false});
 try{
  assert.throws(()=>auditBuiltAstroAssets(f.dir+"/does-not-exist"),/requires a built dist/);
  const report=auditBuiltAstroAssets(f.dir);
  assert.equal(report.assetFiles,0);
  assert.ok(report.missingReferences.length>0);
 }finally{f.dispose();}
});
