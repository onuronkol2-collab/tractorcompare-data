import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
const css=readFileSync(new URL("../src/styles/global.css",import.meta.url),"utf8");
const compare=readFileSync(new URL("../src/components/TractorComparison.astro",import.meta.url),"utf8");

function channel(x) {
  const value=parseInt(x,16)/255;
  return value<=.04045 ? value/12.92 : ((value+.055)/1.055)**2.4;
}
function luminance(hex) {
  const s=hex.replace("#","");
  return .2126*channel(s.slice(0,2))+.7152*channel(s.slice(2,4))+.0722*channel(s.slice(4,6));
}
function contrast(a,b) {
  const [light,dark]=[luminance(a),luminance(b)].sort((x,y)=>y-x);
  return (light+.05)/(dark+.05);
}
function colorFor(source,selector) {
  for(const rule of source.matchAll(/([^{}]+)\{([^{}]+)\}/g)){
    const names=rule[1].split(",").map(v=>v.trim());
    if(!names.includes(selector))continue;
    const foreground=rule[2].match(/(?:^|;)\s*color:\s*(#[a-f0-9]{6})\s*;/i)?.[1];
    if(foreground)return foreground;
  }
  throw new Error("Missing explicit color for "+selector);
}
const targets=[
  [".card-index","#edf3e9"],
  [".feature-card > p:last-of-type","#edf3e9"],
  [".data-copy .eyebrow","#eaf0e8"],
  [".data-copy > p:not(.eyebrow)","#eaf0e8"],
  [".principle-list span","#eaf0e8"],
  [".panel-kicker","#fbfcf9"],
  [".spec-number","#fbfcf9"],
  [".spec-state","#fbfcf9"],
  [".approach-copy p","#f5f7f2"],
  [".roadmap-strip span","#f5f7f2"],
  [".roadmap-strip small","#f5f7f2"],
  [".footer-bottom","#101a16"],
  [".catalog-toolbar > span","#f5f7f2"],
  [".tractor-brand","#ffffff"],
  [".tractor-card-meta","#f1f5ef"],
  [".tractor-card-specs small","#ffffff"],
  [".tractor-card-footer","#ffffff"],
  [".model-spec-heading .eyebrow","#f5f7f2"],
  [".model-spec-heading > p","#f5f7f2"],
  [".model-spec-note","#ffffff"],
];
test("mobile audit's known small-text elements have at least 4.5:1 contrast",()=>{
  for(const [selector,background] of targets){
    const foreground=colorFor(css,selector);
    assert.ok(contrast(foreground,background)>=4.5,
      selector+" contrast "+contrast(foreground,background).toFixed(2)+" < 4.5");
  }
  assert.ok(contrast(colorFor(compare,".tc-missing"),"#ffffff")>=4.5);
});
