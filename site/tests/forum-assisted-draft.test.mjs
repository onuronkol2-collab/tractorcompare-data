import test from "node:test";
import assert from "node:assert/strict";
import {parseAssistedDraft,ASSISTED_DRAFT_MAX_BYTES} from "../src/lib/forum-assisted-draft.mjs";
const valid={version:1,title:"Traktör teknik soruları",body:"Bu metin en az kırk karakter içeren bir forum taslağıdır.",category:"questions",locale:"tr"};
test("imports only editable fields, never authorization or consent",()=>{
 assert.deepEqual(parseAssistedDraft(JSON.stringify(valid)),{title:valid.title,body:valid.body,category:"questions",source_locale:"tr",tractor_id:""});
 for(const key of ["author_id","status","translation_consent","token","slug","__proto__"]) assert.throws(()=>parseAssistedDraft(JSON.stringify(valid).slice(0,-1)+','+JSON.stringify(key)+':true}'));
});
test("rejects bad input, oversized and unknown fields",()=>{
 for(const d of [{...valid,version:2},{...valid,locale:"xx"},{...valid,category:"other"},{...valid,title:"https://example.com test"},{...valid,body:"short"},{...valid,body:"x".repeat(12001)},{...valid,tractor_id:"bad"}]) assert.throws(()=>parseAssistedDraft(JSON.stringify(d)));
 for(const raw of ["null","[]","not json","x".repeat(ASSISTED_DRAFT_MAX_BYTES+1)]) assert.throws(()=>parseAssistedDraft(raw));
 assert.throws(()=>parseAssistedDraft(JSON.stringify(valid),40));
});
test("preserves literal content for existing editor and supports all locales",()=>{
 for(const locale of ["en","tr","zh","hi","pt-br","fr","de","ru","ja","es"]) assert.equal(parseAssistedDraft(JSON.stringify({...valid,locale})).source_locale,locale);
 const body="<script>not executable</script> This is literal editor text, not HTML.";
 assert.equal(parseAssistedDraft(JSON.stringify({...valid,body})).body,body);
});
