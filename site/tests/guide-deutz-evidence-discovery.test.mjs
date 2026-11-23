import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {DEUTZ_5D_GS_PILOT,curatedDeutz5DPair} from "../src/lib/deutz-5d-editorial.ts";

const guide=readFileSync(new URL("../src/components/TractorTechnicalDeepDive.astro",import.meta.url),"utf8");
const pair=readFileSync(new URL("../src/components/Deutz5DGSEditorialComparison.astro",import.meta.url),"utf8");

test("engine power guide gives only an exact, source-gated real-model example",()=>{
 assert.match(guide,/const hasPowerStandards = slug === "tractor-engine-power-and-torque"/);
 assert.match(guide,/const powerCase=hasPowerStandards/);
 assert.match(guide,/curatedDeutz5DPair\(\(await getPublicCatalog\(\)\)\.tractors\)/);
 assert.match(guide,/\{powerCase && <section class="learn-chapter learn-source-case"/);
 assert.match(guide,/powerCase\.rows\.find\(r=>r\.key===f\.key\)/);
 for(const field of ["engine_rated_power","engine_max_power","engine_torque"])
  assert.match(guide,new RegExp('"'+field+'"'));
 assert.match(guide,/<th scope="row">\{item.label\}<\/th>/);
 assert.match(guide,/<td>\{item.row\?\.left\} \{item.row\?\.unit\}<\/td>/);
 assert.match(guide,/<td>\{item.row\?\.right\} \{item.row\?\.unit\}<\/td>/);
 assert.doesNotMatch(guide,/hardcoded-fuel-use|ranked-better-tractor/);
});

test("authentic internal pair path and direct manufacturer source are the actual visible links",()=>{
 assert.equal(DEUTZ_5D_GS_PILOT.path,"/compare/deutz-fahr-5090-d-gs-vs-5100-d-gs/");
 assert.match(guide,/href=\{localizedPath\(lang,DEUTZ_5D_GS_PILOT\.path\)\}/);
 assert.match(guide,/href=\{powerCase\.source\} target="_blank" rel="noopener noreferrer"/);
 assert.match(guide,/\.\.\.\(powerCase\?\[DEUTZ_5D_GS_PILOT\.source\]:\[\]\)/);
 assert.match(pair,/curatedDeutz5DPair\(catalog\.tractors\)/);
 assert.match(pair,/indexableLocales=\{\["en","tr"\]\}/);
 assert.match(pair,/indexable=\{Boolean\(pair\)\}/);
 assert.ok(typeof curatedDeutz5DPair==="function");
});

test("model example stays helpful, keyboard accessible and avoids false test claims",()=>{
 assert.match(guide,/role="region" tabindex="0" aria-label=/);
 assert.match(guide,/<caption>\{tr\?/);
 assert.match(guide,/\.learn-source-case-table:focus-visible/);
 assert.match(guide,/not an independent, like-for-like PTO or drawbar power test/);
 assert.match(guide,/Bu tablo üretici beyanlarını yan yana koyar/);
 assert.match(guide,/real model example|real-model example|REAL MODEL EXAMPLE/);
 assert.doesNotMatch(guide,/("FAQPage"|"Product"|"AggregateRating")/);
});
