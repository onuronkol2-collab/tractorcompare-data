import test from "node:test";
import assert from "node:assert/strict";
import {mkdtempSync,mkdirSync,writeFileSync,rmSync} from "node:fs";
import {tmpdir} from "node:os";
import {join} from "node:path";
import {inspectDocumentImageAlts,inspectUndocumentedEmptyImageAlts,auditBuiltImageAlts} from "../scripts/verify-sitewide-image-alts.mjs";
import {inspectSocialMetadata} from "../scripts/verify-sitewide-social-metadata.mjs";
import {scanHeadTags} from "../scripts/verify-sitewide-meta-descriptions.mjs";

test("single-pass image audit preserves ignored regions, exact issue indices and exceptions",()=>{
 const html='<script>const x="<img src=hidden>"</script><!-- <img> --><img src="a" title="alt=wrong"><img src="b" alt=""><img src="/images/forum-member-default.svg" alt=""><img id="tractor-photo-dialog-img" alt=""><img src="d" alt="model"><img alt="">';
 const counts={images:6,nonemptyAlt:1,emptyAlt:4,missingAlt:[{index:1,src:"a"}]};
 const empty=[{index:2,src:"b",id:""},{index:6,src:"",id:""}];
 assert.deepEqual(inspectDocumentImageAlts(html),counts);
 assert.deepEqual(inspectUndocumentedEmptyImageAlts(html),empty);
 const root=mkdtempSync(join(tmpdir(),"tractorvs-ci-audit-"));
 try{
   mkdirSync(join(root,"tr"));writeFileSync(join(root,"tr","index.html"),html);
   assert.deepEqual(auditBuiltImageAlts(root),{htmlPages:1,images:6,nonemptyAlt:1,emptyAlt:4,missingAlt:[{file:"tr/index.html",index:1,src:"a"}],undocumentedEmptyAlt:empty.map(e=>({file:"tr/index.html",...e}))});
 }finally{rmSync(root,{recursive:true,force:true});}
});

test("head scan preserves rawtext, quoted delimiters, malformed prefixes and template boundaries",()=>{
 const real='<meta name="description" content="a > b">';
 const head='<!-- <meta name="fake"> --><script>const x="<meta name=bad>";</script><template><meta name="ignored"></template><title>Example &amp; text</title><meta-fake content="x">'+real;
 assert.deepEqual(scanHeadTags(head),{links:[],metas:[real],titles:["Example &amp; text"]});
});

test("social metadata index keeps duplicate and property precedence failures",()=>{
 const canonical='<link rel="canonical" href="https://tractorvs.com/">';
 const duplicate='<meta property="og:title" name="twitter:card" content="one"><meta property="OG:TITLE" content="two">';
 const report=inspectSocialMetadata("<head>"+canonical+duplicate+"</head>");
 assert.ok(report.errors.includes("og:title missing/duplicate/empty"));
 assert.ok(report.errors.includes("twitter:card missing/duplicate/empty"));
});
