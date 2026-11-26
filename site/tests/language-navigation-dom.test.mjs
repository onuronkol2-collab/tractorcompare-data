import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {stripTypeScriptTypes} from "node:module";
import vm from "node:vm";

const source=readFileSync(new URL("../src/layouts/SiteLayout.astro",import.meta.url),"utf8");
test("shared language links preserve route queries and avoid repeated DOM updates",()=>{
  const start=source.indexOf("const languageLinks =");
  const end=source.indexOf("// Native <details>",start);
  assert.ok(start>=0&&end>start);
  let constructions=0;
  class CountedURL extends URL {
    constructor(...args){super(...args);constructions++;}
  }
  const origin="https://tractorvs.com";
  class Link {
    constructor(path,code){
      this.value=path;this.dataset={languageCode:code};this.writes=0;this.handlers=new Map();
      this.relTokens=new Set();
      this.relList={toggle:(token,force)=>{
        if(force)this.relTokens.add(token);else this.relTokens.delete(token);
        return this.relTokens.has(token);
      }};
    }
    get href(){return new URL(this.value,origin).href;}
    set href(value){this.writes++;this.value=value;}
    getAttribute(name){assert.equal(name,"href");return this.value;}
    addEventListener(name,fn){this.handlers.set(name,fn);}
  }
  const codes=["en","tr","zh","hi","pt-br","fr","de","ru","ja","es"];
  const links=codes.map(code=>new Link(code==="en"?"/compare/":"/"+code+"/compare/",code));
  const untouched=new Link("/other/","");links.push(untouched);
  const events=new Map();
  const window={location:{origin,search:""},addEventListener:(name,fn)=>events.set(name,fn)};
  vm.runInNewContext(stripTypeScriptTypes(source.slice(start,end)),{document:{querySelectorAll:()=>links},window,URL:CountedURL});
  assert.equal(constructions,10);
  assert.equal(links.reduce((sum,l)=>sum+l.writes,0),0);
  assert.ok(links.every(l=>!l.relTokens.has("nofollow")));
  for(const name of ["pointerdown","focus","contextmenu","click","auxclick"])links[0].handlers.get(name)();
  assert.equal(constructions,10);
  const query="?left=alpha&right=beta";
  window.location.search=query;
  events.get("tractorvs:route-state-changed")();
  assert.equal(constructions,20);
  assert.equal(links[0].value,"/compare/"+query);
  assert.equal(links[1].value,"/tr/compare/"+query);
  assert.equal(links[9].value,"/es/compare/"+query);
  assert.equal(untouched.value,"/other/");
  assert.ok(links.slice(0,10).every(l=>l.relTokens.has("nofollow")));
  assert.equal(untouched.relTokens.has("nofollow"),false);
  for(const name of ["pointerdown","focus","contextmenu","click","auxclick"])links[1].handlers.get(name)();
  assert.equal(constructions,20);
  assert.equal(links.reduce((sum,l)=>sum+l.writes,0),10);
  window.location.search="?q=tractors%20and%20parts";
  links[0].handlers.get("focus")();
  assert.equal(links[0].value,"/compare/?q=tractors%20and%20parts");
  assert.equal(constructions,30);
  window.location.search="";
  events.get("popstate")();
  assert.equal(constructions,40);
  assert.equal(links[0].value,"/compare/");
  assert.equal(links[1].value,"/tr/compare/");
  assert.equal(untouched.writes,0);
  assert.ok(links.every(l=>!l.relTokens.has("nofollow")));
});
