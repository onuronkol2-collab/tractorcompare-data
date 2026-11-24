import test from "node:test";
import assert from "node:assert/strict";
import {extractCanonicalAnchors,summarizeCanonicalGraph} from "../scripts/production-internal-link-graph.mjs";
const root="https://tractorvs.com/",a=root+"brands/a/",b=root+"tractors/b/",c=root+"tractors/c/",d=root+"tr/";
const inventory=new Set([root,a,b,c,d]);
const read=(html,source=root)=>extractCanonicalAnchors(html,source,inventory);
test("only real canonical HTML anchors count, including relative and quoted hrefs",()=>{
 const html='<link rel="canonical" href="'+b+'"><a data-href="'+c+'">fake</a><a title="x > y" href="/brands/a/#spec">a</a><a href=tractors/b/>b</a><a href="/brands/a/">duplicate</a><a href="/tr/?q=x">query</a><a href="/tractors/c">alias</a><a href="#main">self</a><a href="https://other.example/tractors/c/">offsite</a><a href="/tractors/c/" rel="NOFOLLOW external">hint</a>';
 assert.deepEqual(read(html),{targets:[a,b],unsupportedBase:false});
});
test("scripts comments templates raw text and head metadata cannot manufacture links",()=>{
 const html='<script>const h="<a href=/tractors/c/>"</script><!-- <a href="/tractors/c/"> --><template><template><a href="/tractors/c/">x</a></template></template><textarea><a href="/tractors/c/"></textarea><style>x{content:"<a href=/tractors/c/>"}</style><a href="/tr/">real</a>';
 assert.deepEqual(read(html).targets,[d]);
 assert.deepEqual(read('<base href="/brands/"><a href="/tr/">x</a>'),{targets:[],unsupportedBase:true});
});
test("complete graph distinguishes zero incoming, disconnected cycles and entry roots",()=>{
 const observations=new Map([[root,read('<a href="/brands/a/">x</a>')],[a,read('<a href="/brands/a/">self</a>',a)],[b,read('<a href="/tractors/c/">c</a>',b)],[c,read('<a href="/tractors/b/">b</a>',c)],[d,read("",d)]]);
 const result=summarizeCanonicalGraph(inventory,observations,{fullCoverage:true,roots:[root,d]});
 assert.equal(result.complete,true);
 assert.deepEqual(result.noIncoming,[]);
 assert.deepEqual(result.unreachable,[b,c]);
 assert.equal(result.verifiedEdges,3);
 const orphan=summarizeCanonicalGraph(inventory,new Map([...observations,[b,read("",b)],[c,read("",c)]]),{fullCoverage:true,roots:[root,d]});
 assert.deepEqual(orphan.noIncoming,[b,c]);
});
test("partial or unresolved coverage never labels unobserved pages orphan",()=>{
 const observations=new Map([[root,read('<a href="/brands/a/">x</a>')]]);
 const partial=summarizeCanonicalGraph(inventory,observations,{fullCoverage:false,roots:[root]});
 assert.equal(partial.complete,false);assert.equal(partial.noIncoming,null);assert.equal(partial.unreachable,null);
 const full=new Map([...inventory].map(url=>[url,read("",url)]));
 full.set(a,read('<base href="/foo/">',a));
 assert.equal(summarizeCanonicalGraph(inventory,full,{fullCoverage:true,roots:[root]}).complete,false);
});
