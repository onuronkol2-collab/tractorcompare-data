import {test} from "node:test";
import assert from "node:assert/strict";
import {mkdtempSync,mkdirSync,writeFileSync,rmSync} from "node:fs";
import {tmpdir} from "node:os";
import {join} from "node:path";
import {auditBuiltImageAlts,inspectDocumentImageAlts,inspectUndocumentedEmptyImageAlts}
  from "../scripts/verify-sitewide-image-alts.mjs";

test("inspect every document image, not only images inside <main>",()=>{
  const html='<header><img src="/brand.svg" alt="TractorVS"></header>'
    +'<main><img src="/tractor.jpg" alt="Tractor model"></main>'
    +'<footer><img src="/unlabeled.jpg"></footer>'
    +'<dialog><img id="zoom" alt=""></dialog>';
  assert.deepEqual(inspectDocumentImageAlts(html),{
    images:4,nonemptyAlt:2,emptyAlt:1,
    missingAlt:[{index:3,src:"/unlabeled.jpg"}]
  });
});

test("empty decorative alt is valid, bare alt and data-alt are NOT alternatives",()=>{
  const html='<main><img src="/decorative.svg" alt="">'
    +'<img src="/bad-a.svg" alt>'
    +'<img data-alt="not a real alt" src="/bad-b.svg">'
    +'<img alt="A real source-verified photo" src="/good.jpg"></main>';
  assert.deepEqual(inspectDocumentImageAlts(html),{
    images:4,nonemptyAlt:1,emptyAlt:1,
    missingAlt:[
      {index:2,src:"/bad-a.svg"},
      {index:3,src:"/bad-b.svg"}
    ]
  });
});

test("don't mistake JavaScript string, CSS, text area or HTML comment for images",()=>{
  const html=String.raw`<!-- <img src="/comment.png"> -->
   <style>.x:before{content:"<img src='/css.png'>"}</style>
   <script>const sample="<img src='/script.png'>";</script>
   <textarea><img src="/textarea.png"></textarea>
   <picture><source srcset="/photo.webp"><img alt="Tractor" src="/photo.jpg"></picture>`;
  assert.deepEqual(inspectDocumentImageAlts(html),{
    images:1,nonemptyAlt:1,emptyAlt:0,missingAlt:[]
  });
});

test("read every built HTML page including noindex forum and localized pages",()=>{
  const root=mkdtempSync(join(tmpdir(),"tractorvs-image-alt-"));
  try{
    mkdirSync(join(root,"tr","forum"),{recursive:true});
    mkdirSync(join(root,"pt-br","tractors","test"),{recursive:true});
    writeFileSync(join(root,"index.html"),'<main><img alt="Main" src="/ok.png"></main>');
    writeFileSync(join(root,"tr","forum","index.html"),
      '<meta name="robots" content="noindex"><img alt="" src="/member.svg">');
    writeFileSync(join(root,"pt-br","tractors","test","index.html"),
      '<main><img src="/missing.jpg"></main>');
    const result=auditBuiltImageAlts(root);
    assert.equal(result.htmlPages,3);
    assert.equal(result.images,3);
    assert.equal(result.nonemptyAlt,1);
    assert.equal(result.emptyAlt,1);
    assert.deepEqual(result.missingAlt,[
      {file:"pt-br/tractors/test/index.html",index:1,src:"/missing.jpg"}
    ]);
  }finally{rmSync(root,{recursive:true,force:true});}
});

test("empty site build is not silently reported as clean",()=>{
  const root=mkdtempSync(join(tmpdir(),"tractorvs-image-alt-empty-"));
  try{assert.throws(()=>auditBuiltImageAlts(root),/no built HTML files/);}
  finally{rmSync(root,{recursive:true,force:true});}
});

test("a quoted title mentioning alt= is not a real alt attribute",()=>{
  const html='<img title="This picture needs alt=better" src="/bad.jpg">'
    +'<img title="A > inside an attribute" src="/ok.jpg" alt="Actual photo">'
    +'<img data-alt="fake" alt=Genuine src="/other.jpg">';
  assert.deepEqual(inspectDocumentImageAlts(html),{
    images:3,nonemptyAlt:2,emptyAlt:0,
    missingAlt:[{index:1,src:"/bad.jpg"}]
  });
});

test("ignore nested fake image markup without incomplete sanitization",()=>{
  const html=String.raw`<!-- <script><img src="/fake-comment.png"></script> -->
    <script>const example="<img src='/fake-script.png'>";</script>
    <style> .badge {content:"<img src='/fake-style.png'>"} </style>
    <textarea><img src="/fake-textarea.png"></textarea>
    <img src="/actual-decorative.svg" alt="">
    <footer><img title="A > in an attribute" src="/actual-missing.jpg"></footer>`;
  assert.deepEqual(inspectDocumentImageAlts(html),{
    images:2,nonemptyAlt:0,emptyAlt:1,
    missingAlt:[{index:2,src:"/actual-missing.jpg"}]
  });
});

test("blank alt is allowed only for documented decoration and dormant lightbox",()=>{
 const html='<img src="/images/forum-member-default.svg" alt="">'
  +'<dialog><img id="tractor-photo-dialog-img" alt=""></dialog>'
  +'<img src="/decoration.svg" aria-hidden="true" alt="">'
  +'<img src="/another-decoration.png" role="presentation" alt="">'
  +'<img src="/real-tractor.jpg" alt="">'
  +'<img srcset="/real-tractor-480.jpg 480w" alt="">'
  +'<img alt="">';
 assert.deepEqual(inspectUndocumentedEmptyImageAlts(html),[
  {index:5,src:"/real-tractor.jpg",id:""},
  {index:6,src:"",id:""},
  {index:7,src:"",id:""}
 ]);
});

test("new actual photographs cannot silently inherit empty-alt placeholders",()=>{
 const root=mkdtempSync(join(tmpdir(),"tractorvs-blank-alt-"));
 try{
   writeFileSync(join(root,"index.html"),
     '<html><img src="/photos/tr-2026.jpg" alt=""></html>');
   const report=auditBuiltImageAlts(root);
   assert.equal(report.missingAlt.length,0);
   assert.deepEqual(report.undocumentedEmptyAlt,[
      {file:"index.html",index:1,src:"/photos/tr-2026.jpg",id:""}
   ]);
 }finally{rmSync(root,{recursive:true,force:true});}
});
