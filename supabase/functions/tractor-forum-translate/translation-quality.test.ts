import {
 isUntranslatedTurkishTitle,
 sameNumericFacts,
 TRANSLATION_RESUME_FIELDS
} from "./translation-quality.ts";

function assert(condition:boolean, message:string) {
 if (!condition) throw new Error(message);
}

Deno.test("Chinese calendar month numerals do not cause false score-change failures",()=>{
 const source="10 Kasım 2026 ve Nisan–Mayıs 2026: 12,5 / 20, Same 13,7.";
 const translated="2026年11月10日；2026年4月至5月：12,5 / 20；Same 13,7。";
 assert(sameNumericFacts(source,translated,"zh"),"month spellings may be equivalent");
});

Deno.test("Japanese numeric month notation is handled identically",()=>{
 assert(sameNumericFacts("10 Kasım 2026","2026年11月10日","ja"),"Japanese months");
});

Deno.test("changed research score remains blocked despite equivalent dates",()=>{
 const source="10 Kasım 2026; Nisan–Mayıs 2026; 12,5 / 20.";
 const changed="2026年11月10日；2026年4月至5月；13,5 / 20。";
 assert(!sameNumericFacts(source,changed,"zh"),"altered score must fail");
});

Deno.test("invented month or extra metric remains blocked",()=>{
 assert(!sameNumericFacts("10 Kasım 2026", "2026年11月10日，9月", "zh"),
  "additional unrelated numbers must fail");
 assert(!sameNumericFacts("Same 13,7", "Same 13,7; 4月", "zh"),
  "digit month unsupported by original must fail");
});

Deno.test("Latin locales retain exact numeric checks",()=>{
 assert(!sameNumericFacts("10 Kasım 2026", "10 November 2026 11", "en"),
  "extra numeric tokens are disallowed outside date notations");
});

Deno.test("untranslated Turkish titles fail quality gate",()=>{
 const title="2026 Traktör Bayi Memnuniyeti Sıralaması: Markalar ve Puanlar";
 assert(isUntranslatedTurkishTitle(title,title),"original Turkish title must not pass");
 assert(!isUntranslatedTurkishTitle(title,"2026年拖拉机经销商满意度排名"),
  "translated title can pass");
 assert(!isUntranslatedTurkishTitle("John Deere 5075E","John Deere 5075E"),
  "proper-noun-only titles need no forced translation");
});

Deno.test("final checkpoint loads the independent review receipt",()=>{
 assert(TRANSLATION_RESUME_FIELDS.split(",").includes("reviewed_by_model"),
  "finalization requires persisted review model");
});
