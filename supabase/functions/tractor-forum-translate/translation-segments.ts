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

/** A nonzero saved checkpoint MUST always retain its original segmentation.
 * The old chunks cannot be re-grouped without corrupting a translated article.
 */
export function chooseTranslationSegments(body:string,qaNotes:string|null|undefined):string[]{
 const marker=/^PARTS:(\d+)\/(\d+)$/.exec(qaNotes||"");
 if(marker && Number(marker[1])>0){
  const legacy=markdownTranslationSegments(body,2200);
  if(legacy.length!==Number(marker[2]) ||
     Number(marker[1])>legacy.length)throw Error("Translation checkpoint segmentation changed");
  return legacy;
 }
 // The original 2200-character policy is a strict fallback for dense articles
 // where 1600 characters would generate >8 parts or break a complete block.
 try{return markdownTranslationSegments(body,1600);}
 catch(error){
  if(!(error instanceof Error)||!/(segmentation exceeded limits|block is too long)/.test(error.message))throw error;
  return markdownTranslationSegments(body,2200);
 }
}
