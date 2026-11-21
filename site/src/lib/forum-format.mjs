/**
 * Minimal TractorVS community markup. Shared by static HTML and the editor
 * preview. No HTML, arbitrary links, remote media, or executable markup.
 *
 * Supported: paragraphs, > quotations, - bullets, **bold**, *italic*, `code`.
 * Untrusted text is rendered via Astro text nodes / DOM textContent only.
 */
export function forumInline(input){
 const value=String(input??"");
 const result=[];
 const tokens=/(\*\*[^*\n]{1,400}\*\*|`[^`\n]{1,280}`|\*[^*\n]{1,400}\*)/g;
 let offset=0;
 for(const match of value.matchAll(tokens)){
  const start=match.index??0;
  if(start>offset)result.push({type:"text",text:value.slice(offset,start)});
  const token=match[0];
  if(token.startsWith("**"))result.push({type:"bold",text:token.slice(2,-2)});
  else if(token.startsWith("`"))result.push({type:"code",text:token.slice(1,-1)});
  else result.push({type:"italic",text:token.slice(1,-1)});
  offset=start+token.length;
 }
 if(offset<value.length)result.push({type:"text",text:value.slice(offset)});
 if(!result.length)result.push({type:"text",text:""});
 return result;
}
export function forumBlocks(source){
 const input=String(source??"").replace(/\r\n?/g,"\n");
 const lines=input.split("\n");
 const blocks=[];
 let paragraph=[];
 let bullets=[];
 let quoted=[];
 const flush=()=>{
  if(paragraph.length){blocks.push({type:"paragraph",lines:[paragraph.join("\n")]});paragraph=[];}
  if(bullets.length){blocks.push({type:"list",lines:bullets});bullets=[];}
  if(quoted.length){blocks.push({type:"quote",lines:[quoted.join("\n")]});quoted=[];}
 };
 for(const line of lines){
  const trimmed=line.trim();
  if(!trimmed){flush();continue;}
  if(/^[-•]\s+/.test(trimmed)){
   if(paragraph.length||quoted.length)flush();
   bullets.push(trimmed.replace(/^[-•]\s+/,""));
   continue;
  }
  if(/^>\s?/.test(trimmed)){
   if(paragraph.length||bullets.length)flush();
   quoted.push(trimmed.replace(/^>\s?/,""));
   continue;
  }
  if(bullets.length||quoted.length)flush();
  paragraph.push(line);
 }
 flush();
 return blocks.map(block=>({...block,items:block.lines.map(forumInline)}));
}
