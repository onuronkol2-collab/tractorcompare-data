/** Private forum translation segmentation. No network, no side effects.
 * Smaller chunks lower per-call latency without losing previously approved
 * checkpoints produced by the original 2200-character segmentation.
 */
export function markdownTranslationSegments(body:string,max=2200):string[] {
 const normalized=body.replace(/\r\n?/g,"\n");
 const chunks=normalized.split(/(\n{2,})/);
 const work:string[]=[];
 let current="";
 for(let i=0;i<chunks.length;i+=2){
  const block=(chunks[i]||"")+(chunks[i+1]||"");
  if(!block)continue;
  if(block.length>max+300)throw Error("One article block is too long for safe translation");
  if(current&&current.length+block.length>max){work.push(current);current=block;}
  else current+=block;
 }
 if(current)work.push(current);
 if(work.length>1&&work.at(-1)!.length<160&&
    work.at(-2)!.length+work.at(-1)!.length<max+300){
  work[work.length-2]+=work.pop();
 }
 if(!work.length||work.length>8)throw Error("Article segmentation exceeded limits");
 return work;
}

/**
 * Versioned resume markers prevent freshly translated 1600-char segments
 * being incorrectly resumed at the legacy 2200-char boundaries.
 *
 * Legacy PARTS:N/T with N>0 was written by the old 2200-char worker and
 * must retain those boundaries. PARTS:0/T has no accepted sections.
 * New checkpoints use PARTS2:N/T@1600 or PARTS2:N/T@2200.
 */
type SegmentSize = 1600|2200;
export function translationCheckpoint(notes:string|null|undefined):
 {completed:number;total:number;size:SegmentSize|null;legacy:boolean}|null {
 const old=/^PARTS:(\\d+)\\/(\\d+)$/.exec(notes||"");
 const v2=/^PARTS2:(\\d+)\\/(\\d+)@(1600|2200)$/.exec(notes||"");
 if(!old&&!v2)return null;
 const completed=Number((old||v2)![1]),total=Number((old||v2)![2]);
 if(!Number.isSafeInteger(completed)||!Number.isSafeInteger(total)||
    total<1||total>8||completed<0||completed>total)
   throw Error("Invalid translation checkpoint range");
 return {completed,total,size:v2?Number(v2[3]) as SegmentSize:null,legacy:!!old};
}
function freshSegments(body:string):string[]{
 try{return markdownTranslationSegments(body,1600);}
 catch(error){
  if(!(error instanceof Error)||!/(segmentation exceeded limits|block is too long)/.test(error.message))throw error;
  return markdownTranslationSegments(body,2200);
 }
}
export function chooseTranslationSegments(body:string,qaNotes:string|null|undefined):string[]{
 const checkpoint=translationCheckpoint(qaNotes);
 if(!checkpoint||checkpoint.completed===0&&checkpoint.legacy)
   return freshSegments(body);
 const parts=markdownTranslationSegments(body,checkpoint.size||2200);
 if(parts.length!==checkpoint.total)
   throw Error("Translation checkpoint segmentation changed");
 return parts;
}
export function nextTranslationCheckpoint(body:string,previousNotes:string|null|undefined,completed:number):string{
 const previous=translationCheckpoint(previousNotes);
 const segments=chooseTranslationSegments(body,previousNotes);
 if(!Number.isInteger(completed)||completed<1||completed>segments.length)
  throw Error("Invalid completed translation segment index");
 // Keep true legacy >0 checkpoints in their historical 2200-char scheme.
 if(previous?.legacy&&previous.completed>0)
  return "PARTS:"+completed+"/"+segments.length;
 // For new work, choose the exact grouping rather than storing only a
 // segment count; a count alone cannot prove boundaries on the next run.
 const smaller=markdownTranslationSegments(body,1600);
 const size:SegmentSize=segments.length===smaller.length&&
   segments.every((part,i)=>part===smaller[i])?1600:2200;
 return "PARTS2:"+completed+"/"+segments.length+"@"+size;
}
