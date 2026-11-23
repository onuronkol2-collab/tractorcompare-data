import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";

const read = path => readFileSync(new URL("../"+path, import.meta.url), "utf8");
const homeCss = read("src/styles/home-experience.css");
const photoCss = read("src/styles/tractor-photos.css");
const homeComponent = read("src/components/HomeExperience.astro");

// WCAG relative luminance for opaque sRGB hex values.
function luminance(hex) {
  const rgb=hex.match(/[0-9a-f]{2}/gi).map(value=>parseInt(value,16)/255);
  const linear=rgb.map(v=>v<=0.04045 ? v/12.92 : ((v+0.055)/1.055)**2.4);
  return linear[0]*0.2126+linear[1]*0.7152+linear[2]*0.0722;
}
function contrast(a,b) {
  const hi=Math.max(luminance(a),luminance(b));
  const lo=Math.min(luminance(a),luminance(b));
  return (hi+0.05)/(lo+0.05);
}
function colorFor(css,selector,property) {
  const escaped=selector.replace(/[.*+?^${}()|[\]\\]/g,"\\$&");
  const rule=css.match(new RegExp(escaped+"\\s*\\{([^}]*)\\}"));
  assert.ok(rule,selector+" CSS rule missing");
  const value=rule[1].match(new RegExp("(?:^|;)\\s*"+property+"\\s*:\\s*(#[a-fA-F0-9]{6})(?:\\s*;|$)"));
  assert.ok(value,selector+" "+property+" color missing");
  return value[1];
}

test("homepage linked photographer credits meet WCAG AA on their dark frame",()=>{
  assert.match(homeComponent,/import "\.\.\/styles\/home-experience\.css"/);
  assert.match(homeComponent,/<TractorPhoto/);
  const fg=colorFor(homeCss,".home-featured-card .tractor-photo-short-credit a","color");
  const bg=colorFor(photoCss,".tractor-photo-frame","background");
  assert.ok(contrast(fg,bg)>=4.5,
    "Photographer/link color has insufficient contrast: "+contrast(fg,bg).toFixed(2)+":1");
});
