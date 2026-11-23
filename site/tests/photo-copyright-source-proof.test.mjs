import test from "node:test";
import assert from "node:assert/strict";
import {reviewCommonsCopyrightWikitext} from "../scripts/photo-copyright-source-proof.mjs";
const base={
  fileId:"valtra-q305-d4c20807",photographer:"MarcelX42",
  copyrightOwner:"MarcelX42",
  sourcePage:"https://commons.wikimedia.org/wiki/File:Valtra_Q305_Agritechnica_2025_(DSC04493).jpg",
  copyrightClaimUrl:"https://commons.wikimedia.org/wiki/File:Valtra_Q305_Agritechnica_2025_(DSC04493).jpg",
  licenseUrl:"https://creativecommons.org/licenses/by-sa/4.0/"
};
const wiki=`{{Information
|description=Valtra Q305
|date=2025
|source={{own}}
|author=[[User:MarcelX42|MarcelX42]]
}}
{{self|cc-by-sa-4.0}}`;
test("only exact own-work and self-issued Creative Commons copyright claim is approved",()=>{
 assert.equal(reviewCommonsCopyrightWikitext(wiki,base).verified,true);
 for(const bad of [wiki.replace("{{own}}","{{source}}"),
    wiki.replace("{{self|cc-by-sa-4.0}}","{{cc-by-sa-4.0}}"),
    wiki.replaceAll("MarcelX42","OtherAuthor"),
    wiki.replace("|author=[[User:MarcelX42|MarcelX42]]","|author=DifferentAuthor") + "\\n<!-- MarcelX42 appears elsewhere -->"])
   assert.equal(reviewCommonsCopyrightWikitext(bad,base).verified,false);
});
test("CC0, wrong Commons file source and wrong claimant cannot become a copyright notice",()=>{
 for(const bad of [
  {...base,licenseUrl:"https://creativecommons.org/publicdomain/zero/1.0/"},
  {...base,copyrightClaimUrl:"https://commons.wikimedia.org/wiki/File:Other.jpg"},
  {...base,copyrightOwner:"TractorVS"}
 ])assert.equal(reviewCommonsCopyrightWikitext(wiki,bad).verified,false);
});
test("Steyr source uses a documented photographer alias from Wikimedia, not a guessed author",()=>{
 const steyr={...base,fileId:"steyr-4075-kompakt-joachim-2018",
   copyrightOwner:"JoachimKohlerBremen",photographer:"JoachimKohlerBremen",
   sourcePage:"https://commons.wikimedia.org/wiki/File:Steyr_4075_Kompakt.jpg",
   copyrightClaimUrl:"https://commons.wikimedia.org/wiki/File:Steyr_4075_Kompakt.jpg"};
 const content=wiki.replaceAll("MarcelX42","JoachimKohler-HB");
 assert.equal(reviewCommonsCopyrightWikitext(content,steyr).verified,true);
});

test("Unicode source author, hyphenated corporate account and literal author-field boundaries",()=>{
 for(const name of ["Bene Riobó","AGCO-Fendt","MB-one","JoachimKohler-HB"]){
  const p={...base,photographer:name,copyrightOwner:name};
  const w=wiki.replaceAll("MarcelX42",name);
  assert.equal(reviewCommonsCopyrightWikitext(w,p).verified,true,name);
  assert.equal(reviewCommonsCopyrightWikitext(
   w.replace("|author=[[User:"+name+"|"+name+"]]","|author=[[User:Other|Other]]")+"\n<!-- "+name+" -->",p).verified,false,
   "Mention outside the author field cannot prove ownership "+name);
 }
});

test("Belarus 132N original ru.wikipedia uploader signed the nested CC BY-SA 3.0 self-license",()=>{
 const p={...base,fileId:"belarus-132n-picture30-2011",
   photographer:"Picture30",copyrightOwner:"Picture30",
   sourcePage:"https://commons.wikimedia.org/wiki/File:Belarus-132N.jpg",
   copyrightClaimUrl:"https://commons.wikimedia.org/wiki/File:Belarus-132N.jpg",
   licenseName:"CC BY-SA 3.0",
   licenseUrl:"https://creativecommons.org/licenses/by-sa/3.0/"};
 const wikiText=[
  "{{Information",
  "|Source=Собственная работа, ''{{own}}''",
  "|Author={{user at project|Picture30|wikipedia|ru}}",
  "}}",
  "{{self|author={{user at project|Picture30|wikipedia|ru}}|GFDL|CC-BY-SA-3.0|migration = redundant}}"
 ].join("\n");
 assert.equal(reviewCommonsCopyrightWikitext(wikiText,p).verified,true);
 for(const modified of [
  wikiText.replace("CC-BY-SA-3.0","CC-BY-SA-4.0"),
  wikiText.replace("Picture30","AnotherUploader"),
  wikiText.replace("{{own}}","{{not-own}}"),
  wikiText.replace("wikipedia|ru","wikipedia|en")
 ])assert.equal(reviewCommonsCopyrightWikitext(modified,p).verified,false);
 assert.equal(reviewCommonsCopyrightWikitext(wikiText,{...p,fileId:"unreviewed"}).verified,false,
   "Legacy template exception cannot silently extend to other images");
});


test("McCormick X7.621 photographer real name is linked solely to the actual Commons uploader account",()=>{
 const p={...base,fileId:"mccormick-x7-621-barzkowice-zwiadowca21-2026",
   photographer:"Radosław Drożdżewski (User:Zwiadowca21)",
   copyrightOwner:"Radosław Drożdżewski (User:Zwiadowca21)",
   sourcePage:"https://commons.wikimedia.org/wiki/File:Barzkowice_-_McCormick_X7.621_-_12.09.2026_13-26-59.jpg",
   copyrightClaimUrl:"https://commons.wikimedia.org/wiki/File:Barzkowice_-_McCormick_X7.621_-_12.09.2026_13-26-59.jpg"};
 const raw=[
  "{{Information",
  "|Description={{en|McCormick X7.621 tractor}}",
  "|Source={{own}}",
  "|Author=Photographs by {{User:Zwiadowca21}}",
  "}}",
  "{{self|cc-by-sa-4.0}}"
 ].join("\n");
 assert.equal(reviewCommonsCopyrightWikitext(raw,p).verified,true,
   "Verified author's Commons account must match source author field");
 for(const wrong of [
  raw.replace("Zwiadowca21","AnotherUser"),
  raw.replace("{{own}}","Photo by unrelated photographer"),
  raw.replace("{{self|cc-by-sa-4.0}}","{{cc-by-sa-4.0}}"),
  raw.replace("|Author=Photographs by {{User:Zwiadowca21}}","|Author=Unknown")+"\\n<!-- User:Zwiadowca21 -->"
 ]){
  assert.equal(reviewCommonsCopyrightWikitext(wrong,p).verified,false,
   "Alias does not bypass Own work, exact author field, or self-license");
 }
 assert.equal(reviewCommonsCopyrightWikitext(raw,{...p,fileId:"an-unreviewed-photo"}).verified,false,
   "No global byline or surname equivalence");
 assert.equal(reviewCommonsCopyrightWikitext(raw,{...p,copyrightOwner:"TractorVS"}).verified,false);
});
