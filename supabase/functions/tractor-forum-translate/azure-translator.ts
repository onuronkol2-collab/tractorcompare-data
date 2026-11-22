/**
 * A bounded, Gemini-independent Azure Translator adapter.
 * Only consented published forum text may be supplied by the caller.
 * Never transmit private tokens, DB service credentials, or raw media.
 * Deterministic Markdown reconstruction is NOT independent language QA.
 */
type Fetcher=typeof fetch;
type Part={text:string;translate:boolean};
const API="https://api.cognitive.microsofttranslator.com/translate";
const TARGETS:Record<string,string>={
 en:"en",zh:"zh-Hans",hi:"hi","pt-br":"pt",fr:"fr",de:"de",
 ru:"ru",ja:"ja",es:"es"
};
const BRANDS=[
 "Massey Ferguson","New Holland","John Deere","Deutz-Fahr","Case IH",
 "CLAAS","Fendt","Kubota","Tümosan","Başak","Swaraj","Yanmar",
 "CLIMMAR","FADA","NAEDA","PTO","ECE R120"
];
function add(parts:Part[],text:string,translate:boolean){
 if(!text)return;
 const last=parts.at(-1);
 if(last&&last.translate===translate)last.text+=text;
 else parts.push({text,translate});
}
function scanText(parts:Part[],text:string){
 const protect=/(https?:\/\/[^\s<>"'()\[\]]+|\x60[^\x60\n]+\x60|\*\*|__|~~|Massey Ferguson|New Holland|John Deere|Deutz-Fahr|Case IH|CLAAS|Fendt|Kubota|Tümosan|Başak|Swaraj|Yanmar|CLIMMAR|FADA|NAEDA|PTO|ECE R120)/g;
 let at=0,m:RegExpExecArray|null;
 while((m=protect.exec(text))){
  add(parts,text.slice(at,m.index),true);
  add(parts,m[0],false);
  at=m.index+m[0].length;
 }
 add(parts,text.slice(at),true);
}
function inline(parts:Part[],text:string){
 const links=/(!?\[([^\]\n]*)\]\((https?:\/\/[^)\s]+)\))/g;
 let at=0,m:RegExpExecArray|null;
 while((m=links.exec(text))){
  scanText(parts,text.slice(at,m.index));
  if(m[1].startsWith("!"))add(parts,m[0],false);
  else{
   add(parts,"[",false);
   scanText(parts,m[2]);
   add(parts,"]("+m[3]+")",false);
  }
  at=m.index+m[0].length;
 }
 scanText(parts,text.slice(at));
}
export function markdownSpans(source:string):Part[]{
 if(typeof source!=="string"||source.length<1||source.length>5000)
  throw Error("Invalid bounded markdown input");
 const lines=source.split("\n"),parts:Part[]=[];
 let inCode=false;
 for(let i=0;i<lines.length;i++){
  const line=lines[i];
  if(/^\s*(?:\x60{3,}|~{3,})/.test(line)){
   add(parts,line,false);inCode=!inCode;
  }else if(inCode||/^\s*\|[\s:|\-]+\|\s*$/.test(line)){
   add(parts,line,false);
  }else{
   const prefix=/^(\s*(?:#{1,6}\s+|>\s*|[-*+]\s+|\d+[.)]\s+))/.exec(line)?.[1]||"";
   add(parts,prefix,false);
   const remaining=line.slice(prefix.length);
   if(remaining.trimStart().startsWith("|")&&remaining.indexOf("|",1)>=0){
    for(const item of remaining.split(/(\|)/g)){
     if(item==="|")add(parts,item,false);else inline(parts,item);
    }
   }else inline(parts,remaining);
  }
  if(i<lines.length-1)add(parts,"\n",false);
 }
 return parts;
}
export async function translateAzureArticle({
 title,body,target,apiKey,region,fetchFn=fetch,timeoutMs=26000
}:{
 title:string;body:string;target:string;apiKey:string;region:string;
 fetchFn?:Fetcher;timeoutMs?:number
}):Promise<{value:{title:string;body:string};model:string}>{
 if(!apiKey||!region)throw Error("Azure Translator credentials unavailable");
 const to=TARGETS[target];
 if(!to)throw Error("Unsupported Azure language");
 if(!title.trim()||title.length>240||!body.trim()||body.length>5000)
  throw Error("Azure input outside safe limits");
 const titleParts=markdownSpans(title),bodyParts=markdownSpans(body);
 const parts=[...titleParts,...bodyParts];
 const output=parts.map(x=>x.text);
 const items=parts.map((x,index)=>({index,text:x.text,translate:x.translate}))
  .filter(x=>x.translate&&/\p{L}/u.test(x.text));
 const batches:Array<Array<{index:number;text:string}>>=[];
 let batch:Array<{index:number;text:string}>=[],size=0;
 for(const item of items){
  if(item.text.length>4500)throw Error("Azure segment too long");
  if(batch.length>=70||size+item.text.length>8000){
   batches.push(batch);batch=[];size=0;
  }
  batch.push({index:item.index,text:item.text});size+=item.text.length;
 }
 if(batch.length)batches.push(batch);
 if(!batches.length||batches.length>3)
  throw Error("Azure section exceeds bounded request count");
 const url=API+"?api-version=3.0&from=tr&to="+encodeURIComponent(to)+"&textType=plain";
 const began=Date.now();
 for(const chunk of batches){
  const remaining=timeoutMs-(Date.now()-began);
  if(remaining<4000)throw Error("Azure translation time budget exhausted");
  let response:Response;
  try{
   response=await fetchFn(url,{
    method:"POST",headers:{
     "Content-Type":"application/json; charset=UTF-8",
     "Ocp-Apim-Subscription-Key":apiKey,
     "Ocp-Apim-Subscription-Region":region
    },body:JSON.stringify(chunk.map(x=>({text:x.text}))),
    signal:AbortSignal.timeout(Math.min(remaining,18000))
   });
  }catch{throw Error("Azure Translator request timeout")}
  if(!response.ok)throw Error("Azure Translator HTTP "+response.status);
  let parsed:unknown;
  try{parsed=await response.json()}catch{throw Error("Azure response is not JSON")}
  if(!Array.isArray(parsed)||parsed.length!==chunk.length)
   throw Error("Azure response count mismatch");
  for(let i=0;i<chunk.length;i++){
   const row=parsed[i] as {translations?:{to?:string;text?:string}[]};
   const translated=row?.translations?.find(x=>x.to?.toLowerCase()===to.toLowerCase());
   if(typeof translated?.text!=="string"||!translated.text.trim()||
    translated.text.length>Math.max(100,chunk[i].text.length*4))
    throw Error("Azure returned invalid translation");
   output[chunk[i].index]=translated.text;
  }
 }
 const translatedTitle=output.slice(0,titleParts.length).join("");
 const translatedBody=output.slice(titleParts.length).join("");
 if(!translatedTitle.trim()||!translatedBody.trim())
  throw Error("Azure translated article empty");
 return {value:{title:translatedTitle,body:translatedBody},model:"Azure Translator v3"};
}
