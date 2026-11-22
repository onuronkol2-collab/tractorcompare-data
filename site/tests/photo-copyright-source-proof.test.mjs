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
