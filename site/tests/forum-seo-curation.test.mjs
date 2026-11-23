import test from "node:test";
import assert from "node:assert/strict";
import {
 FORUM_RELIABILITY_TOPIC_ID,
 FORUM_RELIABILITY_META_DESCRIPTIONS,
 sourceAwareForumSeoDescription
} from "../src/lib/forum-seo-curation.mjs";
import {forumSeoDescription} from "../src/lib/forum-format.mjs";

const locales=["en","tr","zh","hi","pt-br","fr","de","ru","ja","es"];
const completeArticle=[
"# 2020–2027 Tractor reliability research",
"John Deere, Kubota, New Holland, Deutz-Fahr, Fendt, and CLAAS",
"The article explains official safety recalls and independent workshop findings. These are not comparative failure rates."
].join("\n\n");

test("all ten verified forum locales have distinct, source-grounded SEO descriptions",()=>{
 assert.deepEqual(Object.keys(FORUM_RELIABILITY_META_DESCRIPTIONS).sort(),locales.slice().sort());
 assert.equal(new Set(Object.values(FORUM_RELIABILITY_META_DESCRIPTIONS)).size,10);
 for(const locale of locales){
  const description=sourceAwareForumSeoDescription(FORUM_RELIABILITY_TOPIC_ID,locale,completeArticle);
  assert.equal(description,FORUM_RELIABILITY_META_DESCRIPTIONS[locale]);
  assert.ok(description.length>=70&&description.length<=160,locale+" description length: "+description.length);
  for(const brand of ["John Deere","Kubota","New Holland","Deutz-Fahr","Fendt","CLAAS"])
   assert.ok(description.includes(brand),locale+" missing "+brand);
  assert.match(description,/2026/,locale);
  assert.doesNotMatch(description,/\bhttps?:\/\/|[<>]|#{1,4}|\*\*/,locale);
 }
});

test("updated, incomplete or unrelated topics fall back to source prose",()=>{
 const unrelated="# Other tractor topic\n\nA tractor question about an individual model.";
 assert.equal(sourceAwareForumSeoDescription("713ab252-a925-4ab7-b2c8-a30ce5b86706","en",unrelated),forumSeoDescription(unrelated));
 const sourceNo2027=completeArticle.replace("2027","2025");
 assert.equal(sourceAwareForumSeoDescription(FORUM_RELIABILITY_TOPIC_ID,"en",sourceNo2027),forumSeoDescription(sourceNo2027));
 const sourceMissingBrand=completeArticle.replace("Kubota","OtherBrand");
 assert.equal(sourceAwareForumSeoDescription(FORUM_RELIABILITY_TOPIC_ID,"en",sourceMissingBrand),forumSeoDescription(sourceMissingBrand));
});
