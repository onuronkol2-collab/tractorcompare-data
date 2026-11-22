import test from "node:test";
import assert from "node:assert/strict";
import {countryAwareCatalogUrl} from "../src/lib/catalog-country-url.mjs";
const allowed=["TR","IN","CN","US","BR","FR","DE","RU","JP","CA","ES"];

test("manual pricing country survives a ten-language link without losing q/hash",()=>{
 const current="https://tractorvs.com/tr/tractors/?q=Başak+2075&other=abc#brand-basak";
 const switched="https://tractorvs.com/de/tractors/?q=Başak+2075&other=abc#brand-basak";
 for(const url of [current,switched]){
  const path=countryAwareCatalogUrl(url,"US",allowed);
  const result=new URL(path,"https://tractorvs.com");
  assert.equal(result.searchParams.get("q"),"Başak 2075");
  assert.equal(result.searchParams.get("other"),"abc");
  assert.equal(result.searchParams.get("country"),"US");
  assert.equal(result.hash,"#brand-basak");
  assert.equal(result.pathname,new URL(url).pathname);
 }
});
test("existing query country is replaced once, never duplicated",()=>{
 const path=countryAwareCatalogUrl("https://tractorvs.com/tractors/?country=TR&country=US&q=Belarus","JP",allowed);
 const result=new URL(path,"https://tractorvs.com");
 assert.deepEqual(result.searchParams.getAll("country"),["JP"]);
 assert.equal(result.searchParams.get("q"),"Belarus");
});
test("unsupported countries are rejected without updating a URL",()=>{
 for(const value of ["ZZ","USA","<script>","",null]){
  assert.throws(()=>countryAwareCatalogUrl("https://tractorvs.com/tr/tractors/",value,allowed),/Unsupported/);
 }
 assert.throws(()=>countryAwareCatalogUrl("relative-path","TR",allowed));
});
