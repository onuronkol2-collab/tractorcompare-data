import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {stripTypeScriptTypes} from "node:module";
import vm from "node:vm";

function component(name) {
  const source=readFileSync(new URL("../src/components/"+name+".astro",import.meta.url),"utf8");
  const script=source.slice(source.lastIndexOf("<script>")+8).split("</script>")[0];
  assert.ok(script.length>0);
  return script;
}
function execute(script,context){
  return vm.runInNewContext(stripTypeScriptTypes(script),context);
}
class Element {
  constructor({hidden=false,disabled=false,text="",dataset={},members=[]}={}){
    this.state={hidden,disabled,textContent:text};
    this.writes=0;this.queries=0;this.reads=0;this.data=dataset;this.members=members;
    this.handlers=new Map();this.value="";this.checked=false;this.focused=false;
  }
  get hidden(){return this.state.hidden;}
  set hidden(value){this.writes++;this.state.hidden=value;}
  get disabled(){return this.state.disabled;}
  set disabled(value){this.writes++;this.state.disabled=value;}
  get textContent(){return this.state.textContent;}
  set textContent(value){this.writes++;this.state.textContent=value;}
  get dataset(){this.reads++;return this.data;}
  querySelectorAll(){this.queries++;return this.members;}
  addEventListener(name,handler){this.handlers.set(name,handler);}
  emit(name){assert.ok(this.handlers.has(name));this.handlers.get(name)();}
  focus(){this.focused=true;}
}
const writes=(...nodes)=>nodes.reduce((sum,node)=>sum+node.writes,0);
test("glossary preserves Turkish normalization, grouped results, empty state and avoids repeat DOM mutations",()=>{
  const input=new Element(),a=new Element({dataset:{search:"Şanzıman IŞIK"}}),b=new Element({text:"PTO"});
  const ga=new Element({members:[a]}),gb=new Element({members:[b]});
  const empty=new Element({hidden:true}),status=new Element();
  const ids={"glossary-query":input,"glossary-empty":empty,"glossary-search-status":status};
  const document={documentElement:{lang:"tr"},getElementById:id=>ids[id],
    querySelectorAll:selector=>selector==="[data-glossary-term]"?[a,b]:[ga,gb]};
  execute(component("TractorGlossary"),{document,HTMLInputElement:Element});
  const nodes=[a,b,ga,gb,empty,status];
  input.value="isik";input.emit("input");
  assert.deepEqual(nodes.slice(0,5).map(n=>n.hidden),[false,true,false,true,true]);
  assert.equal(status.textContent,"1 açıklama gösteriliyor");
  const count=writes(...nodes),reads=a.reads+b.reads;
  input.emit("input");assert.equal(writes(...nodes),count);
  assert.equal(a.reads+b.reads,reads);assert.equal(ga.queries+gb.queries,2);
  input.value="absent";input.emit("input");assert.equal(empty.hidden,false);
  input.value="";input.emit("input");
  assert.deepEqual(nodes.slice(0,5).map(n=>n.hidden),[false,false,false,false,true]);
  assert.equal(status.textContent,"2 açıklama gösteriliyor");
});
test("editorial multiword filtering, language selection, reset, focus and counts remain intact",()=>{
  const discovery=new Element({hidden:true}),field=new Element(),clear=new Element(),empty=new Element({hidden:true}),reset=new Element();
  const status=new Element({dataset:{resultTemplate:"{visible} / {total}"}});
  const a=new Element({text:"Café tractor guide IŞIK",dataset:{readingLanguage:"local"}}),b=new Element({text:"Tractor history",dataset:{readingLanguage:"other"}});
  const all=new Element(),local=new Element(),other=new Element();
  all.value="all";all.checked=true;local.value="local";other.value="other";
  const countA=new Element(),countB=new Element();
  const sections=[{querySelector:()=>countA,contains:row=>row===a},{querySelector:()=>countB,contains:row=>row===b}];
  const ids={"#editorial-discovery":discovery,"#editorial-query":field,"#editorial-clear":clear,"#editorial-results-count":status,"#editorial-no-results":empty,"#editorial-reset":reset};
  execute(component("EditorialHub"),{document:{querySelector:id=>ids[id],querySelectorAll:selector=>selector==="[data-editorial-card]"?[a,b]:selector===".editorial-section"?sections:[all,local,other]}});
  assert.equal(discovery.hidden,false);assert.equal(status.textContent,"2 / 2");
  field.value="CAFE guide isik";field.emit("input");
  assert.equal(a.hidden,false);assert.equal(b.hidden,true);assert.equal(status.textContent,"1 / 2");
  assert.equal(countA.textContent,"01");assert.equal(countB.textContent,"00");
  const nodes=[a,b,clear,empty,status,countA,countB],count=writes(...nodes);
  field.emit("input");assert.equal(writes(...nodes),count);
  all.checked=false;other.checked=true;other.emit("change");
  assert.equal(empty.hidden,false);assert.equal(status.textContent,"0 / 2");
  reset.emit("click");assert.equal(field.value,"");assert.equal(field.focused,true);
  assert.equal(all.checked,true);assert.equal(other.checked,false);
  assert.equal(a.hidden,false);assert.equal(b.hidden,false);assert.equal(clear.hidden,true);
  assert.equal(empty.hidden,true);assert.equal(status.textContent,"2 / 2");
  field.value="history";field.emit("input");clear.emit("click");
  assert.equal(field.value,"");assert.equal(a.hidden,false);assert.equal(b.hidden,false);
});
test("advisor equipment toggles preserve allowed choices and disabled state without repeated queries",()=>{
  const plow=new Element(),laser=new Element(),unknown=new Element();
  plow.value="plow";laser.value="laser_leveler";unknown.value="unknown";unknown.checked=true;
  const pf=new Element(),lf=new Element();
  const plowDetail=new Element({members:[pf]}),laserDetail=new Element({members:[lf]});
  const form=new Element({members:[plow,laser,unknown]});
  const script=component("FarmAdvisor");
  const start=script.indexOf("const implementInputs=");
  const end=script.indexOf("const setCountry",start);
  assert.ok(start>=0&&end>start);
  const selected=execute(script.slice(start,end)+"\n;selectedTools;",{form,plowDetail,laserDetail,FARM_IMPLEMENT_TYPES:["plow","laser_leveler"]});
  assert.equal(plowDetail.hidden,true);assert.equal(pf.disabled,true);assert.equal(lf.disabled,true);
  assert.equal(selected().length,0);
  plow.checked=true;plow.emit("change");
  assert.equal(plowDetail.hidden,false);assert.equal(pf.disabled,false);assert.equal(lf.disabled,true);
  assert.equal(Array.from(selected()).join(","),"plow");
  const count=writes(plowDetail,laserDetail,pf,lf);
  plow.emit("change");assert.equal(writes(plowDetail,laserDetail,pf,lf),count);
  plow.checked=false;laser.checked=true;laser.emit("change");
  assert.equal(pf.disabled,true);assert.equal(lf.disabled,false);
  assert.equal(Array.from(selected()).join(","),"laser_leveler");
  assert.equal(form.queries,1);assert.equal(plowDetail.queries+laserDetail.queries,2);
});
