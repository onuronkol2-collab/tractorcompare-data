import test from "node:test";
import assert from "node:assert/strict";
import {readdirSync,readFileSync} from "node:fs";
import {join,relative} from "node:path";
import {fileURLToPath} from "node:url";
import {stripTypeScriptTypes} from "node:module";
import vm from "node:vm";

const root=fileURLToPath(new URL("../src/",import.meta.url));
const retired=["hero-art","art-topline","art-bottomline","live-indicator","tractor-illustration",
 "tractor-svg","orbit","orbit-two","art-coordinate","art-cross","coordinate-a","coordinate-b",
 "cross-a","cross-b","art-corner"];
function* sourceFiles(dir){
  for(const entry of readdirSync(dir,{withFileTypes:true})){
    const path=join(dir,entry.name);
    if(entry.isDirectory())yield* sourceFiles(path);
    else if(entry.isFile()&&/\.(?:astro|html|svg|js|mjs|cjs|ts|tsx|jsx|vue|svelte|css)$/i.test(entry.name))yield path;
  }
}
test("obsolete illustration classes are absent across the site source, not just a sampled home page",()=>{
  const usages=[];
  for(const path of sourceFiles(root)){
    const source=readFileSync(path,"utf8");
    for(const token of retired){
      const pattern=new RegExp("(^|[^a-zA-Z0-9_-])"+token+"(?=$|[^a-zA-Z0-9_-])","m");
      if(pattern.test(source))usages.push(relative(root,path)+": "+token);
    }
  }
  assert.deepEqual(usages,[],"Retired CSS must be restored or explicitly migrated before any use");
});
test("glossary image hints preserve current grid and priority without changing photo identity",()=>{
  const source=readFileSync(join(root,"components/TractorGlossary.astro"),"utf8");
  const css=readFileSync(join(root,"styles/global.css"),"utf8");
  const hero="(max-width: 720px) min(calc(100vw - 58px), 538px), (max-width: 900px) min(calc(100vw - 70px), 608px), min(calc(44.64vw - 44.32px), 495px)";
  const gallery="auto, (max-width: 680px) min(calc(100vw - 88px), 508px), (max-width: 720px) 223px, min(calc(50vw - 81px), 523px)";
  assert.equal(source.split('sizes="'+hero+'"').length-1,2);
  assert.equal(source.split('sizes="'+gallery+'"').length-1,2);
  for(const pattern of [/\.glossary-hero-grid\{[^}]*1\.07fr[^}]*\.93fr[^}]*gap:clamp\(20px,4vw,60px\)/,
   /\.glossary-cover\{[^}]*padding:10px[^}]*border:1px/,
   /\.glossary-cover\{max-width:630px/,
   /\.glossary-gallery\{[^}]*padding:30px/,
   /\.glossary-gallery-grid\{[^}]*repeat\(2,minmax\(0,1fr\)\)[^}]*gap:18px/,
   /\.glossary-gallery figure\{[^}]*padding:8px[^}]*border:1px/,
   /\.glossary-gallery\{padding:17px/,
   /loading="eager" fetchpriority="high"/,/loading="lazy" decoding="async"/,
   /data-photo-url=\{hero.fullUrl\}/,/data-photo-license=\{hero.licenseUrl\}/,
   /data-photo-url=\{photo.fullUrl\}/,/data-photo-license=\{photo.licenseUrl\}/])assert.match(source,pattern);
  assert.match(css,/width: min\(1160px, calc\(100% - 48px\)\)/);
  assert.match(css,/width: min\(100% - 36px, 560px\)/);
});
test("photo lightbox never treats absent metadata as the page URL; normal licensed URLs still resolve",()=>{
 const source=readFileSync(join(root,"components/PhotoLightbox.astro"),"utf8");
 const start=source.indexOf("const safe=");
 const end=source.indexOf("// A copyright/source link",start);
 assert.ok(start>=0&&end>start);
 const safe=vm.runInNewContext(stripTypeScriptTypes(source.slice(start,end)+"\nsafe;"),{URL,location:{href:"https://tractorvs.com/tr/tractors/example/"}});
 for(const value of [""," ","\t","javascript:alert(1)","data:text/html,x"])assert.equal(safe(value),null);
 assert.equal(safe("/images/tractors/example-1920.jpg"),"https://tractorvs.com/images/tractors/example-1920.jpg");
 assert.equal(safe("https://commons.wikimedia.org/wiki/File:Example.jpg"),"https://commons.wikimedia.org/wiki/File:Example.jpg");
 assert.equal(safe("https://creativecommons.org/licenses/by/4.0/"),"https://creativecommons.org/licenses/by/4.0/");
 assert.match(source,/if\(!src\|\|!source\|\|!rights\)return/);
});
