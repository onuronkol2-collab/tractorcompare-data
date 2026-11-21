/**
 * TractorVS safe, bounded community markup, shared by preview and published HTML.
 * No raw HTML, inline images, arbitrary protocols or executable markup.
 *
 * Supported: paragraphs, # / ## / ### headings, > quotes, - bullets,
 * | tables |, **bold**, *italic*, \`code\`, and plain HTTPS/HTTP source URLs.
 * External links are treated as untrusted UGC in renderers (rel=ugc nofollow).
 */
export function forumInline(input) {
 const value=String(input??"");
 const result=[];
 const tokens=/(\*\*[^*\n]{1,400}\*\*|\x60[^\x60\n]{1,280}\x60|\*[^*\n]{1,400}\*|https?:\/\/[^\s<>"'\x60]{1,1500})/g;
 let offset=0;
 const push=(text)=>{if(text)result.push({type:"text",text});};
 for(const match of value.matchAll(tokens)){
  const start=match.index??0;
  if(start>offset)push(value.slice(offset,start));
  const token=match[0];
  if(token.startsWith("**"))result.push({type:"bold",text:token.slice(2,-2)});
  else if(token.startsWith("\x60"))result.push({type:"code",text:token.slice(1,-1)});
  else if(token.startsWith("*"))result.push({type:"italic",text:token.slice(1,-1)});
  else{
   // Keep punctuation outside the link; never create a javascript:, data:,
   // credential-bearing, or malformed destination from untrusted user text.
   const tail=token.match(/[.,;!?)}\]]+$/)?.[0]||"";
   const candidate=tail?token.slice(0,-tail.length):token;
   let allowed=false;
   try{
    const url=new URL(candidate);
    allowed=(url.protocol==="https:"||url.protocol==="http:")&&
      !!url.hostname&&!url.username&&!url.password&&
      candidate.length<=1500;
   }catch{}
   if(allowed)result.push({type:"url",text:candidate});
   else push(candidate);
   push(tail);
  }
  offset=start+token.length;
 }
 if(offset<value.length)push(value.slice(offset));
 if(!result.length)result.push({type:"text",text:""});
 return result;
}
function tableCells(line) {
 const trimmed=line.trim();
 if(!trimmed.includes("|"))return [];
 const row=trimmed.replace(/^\|/,"").replace(/\|$/,"");
 return row.split("|").map(x=>x.trim());
}
function divider(line,count) {
 const cells=tableCells(line);
 return cells.length===count&&cells.every(x=>/^:?-{3,}:?$/.test(x));
}
export function forumBlocks(source) {
 const lines=String(source??"").replace(/\r\n?/g,"\n").split("\n");
 const blocks=[];
 let paragraph=[],bullets=[],quoted=[];
 const flush=()=>{
  if(paragraph.length){blocks.push({type:"paragraph",lines:[paragraph.join("\n")]});paragraph=[];}
  if(bullets.length){blocks.push({type:"list",lines:bullets});bullets=[];}
  if(quoted.length){blocks.push({type:"quote",lines:[quoted.join("\n")]});quoted=[];}
 };
 for(let i=0;i<lines.length;i++){
  const line=lines[i],trimmed=line.trim();
  if(!trimmed){flush();continue;}
  const heading=/^#{1,4}\s+(.{1,250})$/.exec(trimmed);
  if(heading){
   flush();
   const hashes=(trimmed.match(/^#+/)||["##"])[0].length;
   blocks.push({type:"heading",level:Math.min(4,Math.max(2,hashes)),lines:[heading[1].trim()]});
   continue;
  }
  const header=tableCells(trimmed);
  if(header.length>=2&&header.length<=8&&i+1<lines.length&&divider(lines[i+1],header.length)){
   flush();i++;
   const rows=[];
   while(i+1<lines.length&&rows.length<80){
    const cells=tableCells(lines[i+1]);
    if(cells.length!==header.length||!lines[i+1].trim())break;
    rows.push(cells);i++;
   }
   blocks.push({type:"table",header:header.map(forumInline),
    rows:rows.map(row=>row.map(forumInline))});
   continue;
  }
  if(/^[-•]\s+/.test(trimmed)){
   if(paragraph.length||quoted.length)flush();
   bullets.push(trimmed.replace(/^[-•]\s+/,""));continue;
  }
  if(/^>\s?/.test(trimmed)){
   if(paragraph.length||bullets.length)flush();
   quoted.push(trimmed.replace(/^>\s?/,""));continue;
  }
  if(bullets.length||quoted.length)flush();
  paragraph.push(line);
 }
 flush();
 return blocks.map(block=>block.type==="table"?block:
  ({...block,items:block.lines.map(forumInline)}));
}
/** Metadata must be plain prose, not literal Markdown headings or delimiters. */
export function forumSeoDescription(body,max=175) {
 const clean=String(body??"").replace(/^\s{0,3}#{1,4}\s+/gm,"")
  .replace(/(?:\*\*|\x60|(?<!\*)\*(?!\*)|[|])/g,"")
  .replace(/^\s*[-•>]\s+/gm,"")
  .replace(/\s+/g," ").trim();
 if(clean.length<=max)return clean;
 return clean.slice(0,max).replace(/\s+\S*$/u,"").trimEnd()||clean.slice(0,max);
}
