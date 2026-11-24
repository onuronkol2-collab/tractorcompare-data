import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {inspectSocialMetadata} from "../scripts/verify-sitewide-social-metadata.mjs";

const fallback="https://tractorvs.com/images/tractorvs-share-card.png";
function fixture({photo=fallback,noindex=false,extra=""}={}){
  return '<!doctype html><html><head><title>TractorVS</title>'+
    '<link rel="canonical" href="https://tractorvs.com/">'+
    '<meta name="robots" content="'+(noindex?"noindex,nofollow":"index,follow")+'">'+
    '<meta property="og:title" content="TractorVS">'+
    '<meta property="og:type" content="website">'+
    '<meta property="og:description" content="Compare documented tractor models">'+
    '<meta property="og:url" content="https://tractorvs.com/">'+
    '<meta property="og:image" content="'+photo+'">'+
    '<meta name="twitter:card" content="summary_large_image">'+
    '<meta name="twitter:image" content="'+photo+'">'+
    '<meta property="og:image:alt" content="'+(photo===fallback?"TractorVS":"Fotoğraf: Başak 2075 BK")+'">'+
    '<meta name="twitter:image:alt" content="'+(photo===fallback?"TractorVS":"Fotoğraf: Başak 2075 BK")+'">'+extra+
    '</head><body><main>Models</main></body></html>';
}
test("one canonical indexable social preview passes for brand or licensed model image",()=>{
  assert.deepEqual(inspectSocialMetadata(fixture()).errors,[]);
  assert.equal(inspectSocialMetadata(fixture()).brandFallback,true);
  const source="https://tractorvs.com/images/tractors/example-1920.jpg";
  assert.deepEqual(inspectSocialMetadata(fixture({photo:source})).errors,[]);
  assert.equal(inspectSocialMetadata(fixture({photo:source})).brandFallback,false);
});
test("noindex pages are excluded, not given misleading canonical social obligations",()=>{
  assert.equal(inspectSocialMetadata(fixture({noindex:true})),null);
});
test("blank, missing, duplicated and inconsistent metadata fails",()=>{
  assert.ok(inspectSocialMetadata(fixture({photo:""})).errors.length);
  assert.ok(inspectSocialMetadata(fixture({extra:'<meta property="og:image" content="https://example.com/other.png">'})).errors.length);
  assert.ok(inspectSocialMetadata(fixture().replace('property="og:url" content="https://tractorvs.com/"','property="og:url" content="https://other.example/"')).errors.length);
  assert.ok(inspectSocialMetadata(fixture().replace('name="twitter:card" content="summary_large_image"','name="twitter:card" content="summary"')).errors.length);
});
test("brand social asset exists as a real 1200x630 PNG, not a placeholder URL",()=>{
  const img=readFileSync(new URL("../public/images/tractorvs-share-card.png",import.meta.url));
  assert.equal(img.subarray(0,8).toString("hex"),"89504e470d0a1a0a");
  assert.equal(img.toString("ascii",12,16),"IHDR");
  assert.equal(img.readUInt32BE(16),1200);
  assert.equal(img.readUInt32BE(20),630);
  assert.ok(img.byteLength>10000 && img.byteLength<1500000);
});

test("an apparent social image in a script cannot hide a missing real tag",()=>{
  const tag='<meta property="og:image" content="'+fallback+'">';
  const html=fixture().replace(tag,"<script type='text/plain'>"+tag+"</script>");
  assert.ok(inspectSocialMetadata(html).errors.some(x=>x.startsWith("og:image ")));
});


test("model preview and fallback must have one matching and truthful image alt per platform",()=>{
 const photo="https://tractorvs.com/images/tractors/example-1920.jpg";
 const modelUrl="https://tractorvs.com/tr/tractors/basak-2075-bk/";
 const html=fixture({photo}).replaceAll('content="https://tractorvs.com/"','content="'+modelUrl+'"').replace('href="https://tractorvs.com/"','href="'+modelUrl+'"');
 assert.deepEqual(inspectSocialMetadata(html).errors,[]);
 assert.ok(inspectSocialMetadata(html.replace('<meta name="twitter:image:alt" content="Fotoğraf: Başak 2075 BK">','')).errors.some(x=>x.startsWith("twitter:image:alt ")));
 assert.ok(inspectSocialMetadata(html.replace('property="og:image:alt" content="Fotoğraf: Başak 2075 BK"','property="og:image:alt" content="Other model"')).errors.includes("social preview alternative texts differ"));
 assert.ok(inspectSocialMetadata(fixture().replaceAll('image:alt" content="TractorVS"','image:alt" content="Tractor photo"')).errors.includes("brand fallback alt misidentifies image"));
});

test("model detail passes localized alt only for its real licensed photo preview",()=>{
 const detail=readFileSync(new URL("../src/components/TractorDetail.astro",import.meta.url),"utf8");
 const layout=readFileSync(new URL("../src/layouts/SiteLayout.astro",import.meta.url),"utf8");
 assert.match(detail,/ogImageAlt=\{socialPreviewImage \? tractorPhotoAlt\(tractor,lang\) : null\}/);
 assert.match(layout,/ogImage && ogImageAlt && <meta property="og:image:alt" content=\{ogImageAlt\}/);
 assert.match(layout,/ogImage && ogImageAlt && <meta name="twitter:image:alt" content=\{ogImageAlt\}/);
});
