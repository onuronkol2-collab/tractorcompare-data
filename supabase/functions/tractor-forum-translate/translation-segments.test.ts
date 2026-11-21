import {chooseTranslationSegments,markdownTranslationSegments} from "./translation-segments.ts";
function assert(v:unknown,message:string){if(!v)throw Error(message);}
const block=(i:number)=>"## Section "+i+"\n"+"Agricultural engineering comparison with stable model and safety data. ".repeat(2);
const article=Array.from({length:62},(_,i)=>block(i)).join("\n\n");
Deno.test("fresh long articles use smaller chunks without dropping markdown blocks",()=>{
 const fresh=chooseTranslationSegments(article,null);
 const legacy=markdownTranslationSegments(article,2200);
 assert(fresh.length<=8 && fresh.length>=legacy.length,"eight bounded chunks maximum");
 assert(fresh.join("")===article,"every source character and separator preserved exactly");
 for(const item of fresh)assert(item.length<=1900,"small bounded chunk");
});
Deno.test("nonzero old checkpoints retain exact original grouping and QA receipt",()=>{
 const legacy=markdownTranslationSegments(article,2200);
 const preserved=chooseTranslationSegments(article,"PARTS:2/"+legacy.length);
 assert(JSON.stringify(preserved)===JSON.stringify(legacy),
  "resume old segment boundaries exactly");
});
Deno.test("a zero checkpoint may use improved grouping, never publishes previous draft",()=>{
 const old=markdownTranslationSegments(article,2200);
 const fresh=chooseTranslationSegments(article,"PARTS:0/"+old.length);
 assert(fresh.length<=8,"bounded fresh start");
 assert(fresh.join("")===article || fresh.join("").trim()===article.trim(),"source complete");
});
Deno.test("changed or invalid historical checkpoints fail closed",()=>{
 const old=markdownTranslationSegments(article,2200);
 let refused=false;try{chooseTranslationSegments(article,"PARTS:3/"+(old.length+1));}catch{refused=true;}
 assert(refused,"mismatched segmentation must never append to wrong section");
});
Deno.test("too-large unsplittable paragraphs remain rejected, not silently cut",()=>{
 let refused=false;try{chooseTranslationSegments("a".repeat(2600),null)}catch{refused=true;}
 assert(refused,"never split tables/paragraphs unsafely");
});
