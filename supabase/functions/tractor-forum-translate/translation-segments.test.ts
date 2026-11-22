import {chooseTranslationSegments,markdownTranslationSegments,translationCheckpoint,nextTranslationCheckpoint} from "./translation-segments.ts";
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


Deno.test("new 1600-character checkpoints resume EXACT same blocks across repeated runs",()=>{
  const original=chooseTranslationSegments(article,null);
  const legacy=markdownTranslationSegments(article,2200);
  assert(original.length>=legacy.length,"new grouping must be comparable");
  const saved=nextTranslationCheckpoint(article,null,1);
  const marker=translationCheckpoint(saved);
  assert(marker?.completed===1&&marker?.total===original.length&&marker.size===1600,
    "new checkpoint must encode segment size, not only a count");
  assert(JSON.stringify(chooseTranslationSegments(article,saved))===JSON.stringify(original),
    "resume must not replace 1600-character segmentation with 2200-character segmentation");
  const saved2=nextTranslationCheckpoint(article,saved,2);
  assert(saved2==="PARTS2:2/"+original.length+"@1600","subsequent accepted chunk remains versioned");
  assert(JSON.stringify(chooseTranslationSegments(article,saved2))===JSON.stringify(original),"Checkpoint expectation must hold");
});
Deno.test("old 2200-character checkpoints keep original boundaries with no cross-version data loss",()=>{
  const original=markdownTranslationSegments(article,2200);
  const notes="PARTS:1/"+original.length;
  assert(JSON.stringify(chooseTranslationSegments(article,notes))===JSON.stringify(original),"Checkpoint expectation must hold");
  assert(nextTranslationCheckpoint(article,notes,2)==="PARTS:2/"+original.length,"Checkpoint expectation must hold");
});
Deno.test("zero accepted sections may safely use new chunk scheme on a legacy private draft",()=>{
  const old=markdownTranslationSegments(article,2200);
  const newSegments=chooseTranslationSegments(article,"PARTS:0/"+old.length);
  assert(JSON.stringify(newSegments)===JSON.stringify(chooseTranslationSegments(article,null)),"Checkpoint expectation must hold");
  assert(nextTranslationCheckpoint(article,"PARTS:0/"+old.length,1)
    ==="PARTS2:1/"+newSegments.length+"@1600","Checkpoint expectation must hold");
});
Deno.test("explicit 2200 fallback checkpoints resume when long markdown blocks exceed 1600",()=>{
  const hardBlock="## Tractor specification\n"+"Verified engineering qualifier ".repeat(67);
  assert(hardBlock.length>1900&&hardBlock.length<2500,"block targets 2200-only fallback");
  const text=hardBlock+"\n\n"+"Source and variant preserved. ".repeat(7);
  const groups=chooseTranslationSegments(text,null);
  assert(groups.length>=1,"fallback must return groups");
  const saved=nextTranslationCheckpoint(text,null,1);
  assert(saved.endsWith("@2200"),"saved chunk method must reflect actual 2200 fallback");
  assert(JSON.stringify(chooseTranslationSegments(text,saved))===JSON.stringify(groups),"Checkpoint expectation must hold");
});
Deno.test("changed body, forged checkpoint size or out-of-range progress must fail closed",()=>{
  const fresh=chooseTranslationSegments(article,null);
  const good=nextTranslationCheckpoint(article,null,1);
  for(const altered of [good.replace(/@\d+$/,"@9999"),good.replace(/^PARTS2:1/,"PARTS2:99")]){
    let rejected=false;try{chooseTranslationSegments(article,altered)}catch{rejected=true;}
    // Invalid syntax is not a private progress marker, and must NEVER be
    // mistaken by the worker for a verified, resumable checkpoint.
    let parsed=false;
    try{parsed=translationCheckpoint(altered)!==null;}catch{rejected=true;}
    assert(!parsed||rejected,
      "invalid or out-of-range progress cannot be trusted");
  }
  let rejected=false;
  try{chooseTranslationSegments(article+" added source paragraph",good)}catch{rejected=true;}
  assert(rejected||fresh.join("")!==article+" added source paragraph",
    "source hash validation is separately required before resuming");
  let rangeRejected=false;try{nextTranslationCheckpoint(article,null,fresh.length+1)}catch{rangeRejected=true;}
  assert(rangeRejected,"cannot record more accepted chunks than were produced");
});
