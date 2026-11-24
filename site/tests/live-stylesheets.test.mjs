import test from "node:test";
import assert from "node:assert/strict";
import {localStylesheets,stylesheetProblem} from "../scripts/live-stylesheets.mjs";
import {scanHeadTags} from "../scripts/verify-sitewide-meta-descriptions.mjs";

test("extracts distinct local styles from the real document head",()=>{
  const {links} = scanHeadTags(`
    <link href='/a.css?v=3&amp;lang=tr' rel='Stylesheet alternate'>
    <link rel=stylesheet href='/a.css?v=3&amp;lang=tr#somewhere'>
    <script>const markup="<link rel=stylesheet href='/mock.css'>";</script>
    <link rel=preload as=style href=/unused.css>
    <link rel=stylesheet href='//example.org/external.css'>
    <link rel=stylesheet href='./local.css'>`);
  assert.deepEqual([...localStylesheets(links,"https://tractorvs.com/tr/")],[
    "https://tractorvs.com/a.css?v=3&lang=tr","https://tractorvs.com/tr/local.css"
  ]);
});
test("accepts a CSS GET and rejects a redirect, 404, blank, HTML or incorrect MIME",()=>{
  const check=(status,type,body)=>stylesheetProblem(new Response(body,{status,headers:{"Content-Type":type}}),body);
  assert.equal(check(200,"text/css; charset=utf-8",".hero{}"),null);
  for (const args of [[301,"text/css","redirect"],[404,"text/css","missing"],
    [200,"text/css"," "],[200,"text/css","<!doctype html>"],[200,"text/html",".hero{}"]]) {
    assert.ok(check(...args));
  }
});
