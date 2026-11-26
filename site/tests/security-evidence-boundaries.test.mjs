import test from "node:test";
import assert from "node:assert/strict";
import {decodeEvidenceEntities,evidenceText,matchesExactOrigin} from "../../supabase/functions/_shared/evidence-text.mjs";
import {hasExactCanonical} from "../scripts/production-release-gate.mjs";
import {inspectSeoTitle} from "../scripts/verify-sitewide-seo-titles.mjs";
import {scrubMarkup} from "../../supabase/functions/tractor-oem-free-collector/policy.mjs";

test("origin comparisons reject lookalike domains, credentials, scheme and port",()=>{
 for(const url of ["https://tractorvs.com/","https://tractorvs.com/tr/forum/","https://tractorvs.com:443/"])
  assert.equal(matchesExactOrigin(url,"https://tractorvs.com"),true,url);
 for(const url of ["https://tractorvs.com.evil.example/","https://evil.example/tractorvs.com","https://tractorvs.com@evil.example/","https://evil.example@tractorvs.com/","http://tractorvs.com/","https://tractorvs.com:444/","not a URL"])
  assert.equal(matchesExactOrigin(url,"https://tractorvs.com"),false,url);
});
test("one decoding pass preserves literal escaped markup and handles numeric bounds",()=>{
 assert.equal(decodeEvidenceEntities("&amp;lt; &amp;quot; &#39; &#x1F69C;"),"&lt; &quot; ' 🚜");
 assert.equal(decodeEvidenceEntities("&#0; &#xD800; &#1114112;"),"� � �");
 assert.equal(evidenceText("<b>A &lt; B &amp;lt; C</b>",{separator:""}),"A < B &lt; C");
});
test("text evidence skips raw markup, comments and quoted tag delimiters",()=>{
 assert.equal(evidenceText('<b title="x > y">75 hp</b><!-- 99 hp --><SCRIPT>fake 100 hp</sCrIpT ><style>200 hp</style><p>3000 kg</p>'),"75 hp 3000 kg");
 assert.equal(evidenceText("Visible<script>fake 99 hp</scriptx>still hidden</script >End"),"Visible End");
 assert.equal(evidenceText("Valid <!-- broken 99 hp"),"Valid");
 assert.equal(evidenceText('Valid <span title="unterminated 99 hp'),"Valid");
 assert.equal(scrubMarkup("<p>75 hp</p><script>900 hp</script><p>3000 kg</p>"),"75 hp 3000 kg");
});
test("SEO heading compares visible text without double decoding",()=>{
 const page=inspectSeoTitle("<html><head><title>Tractor A &amp; B</title></head><body><h1><span>Tractor A</span> &amp; B</h1></body></html>","tractors/a/index.html");
 assert.equal(page.heading,"Tractor A & B");
 assert.deepEqual(page.errors,[]);
 const literal=inspectSeoTitle("<html><head><title>A &lt;b&gt; B</title></head><body><h1>A &lt;b&gt; B</h1></body></html>","tractors/a/index.html");
 assert.equal(literal.heading,"A <b> B");
 assert.deepEqual(literal.errors,[]);
});
test("release gate checks one actual canonical head link",()=>{
 const doc=links=>"<html><head>"+links+"</head><body>https://tractorvs.com/tr/</body></html>";
 const link=url=>'<link rel="canonical" href="'+url+'">';
 const expected="https://tractorvs.com/tr/";
 assert.equal(hasExactCanonical(doc(link(expected)),expected),true);
 assert.equal(hasExactCanonical(doc('<link href="'+expected+'" rel="canonical">'),expected),true);
 for(const content of [link("https://tractorvs.com.evil.example/tr/"),link("https://tractorvs.com/"),link(expected+"?q=1"),link(expected+"#x"),link(expected)+link(expected),'<script>'+JSON.stringify(link(expected))+'</script>','<!--'+link(expected)+'-->'])
  assert.equal(hasExactCanonical(doc(content),expected),false,content);
});
