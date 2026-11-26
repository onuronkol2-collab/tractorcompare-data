/**
 * Conservative plain-text evidence extraction, NOT an HTML sanitizer.
 * Never send this output to innerHTML or an HTML template without escaping.
 * Tokenize once, skip comments and non-visible raw-text elements, then decode
 * only the supported entity vocabulary once. Unknown entities stay literal.
 * Malformed unterminated markup is discarded rather than inventing evidence.
 */
export function decodeEvidenceEntities(value){
 const named=Object.freeze({amp:"&",lt:"<",gt:">",quot:'"',apos:"'",nbsp:" "});
 return String(value??"").replace(/&(?:amp|lt|gt|quot|apos|nbsp|#(?:x[0-9a-f]+|[0-9]+));/gi,entity=>{
  const name=entity.slice(1,-1).toLowerCase();
  if(Object.hasOwn(named,name))return named[name];
  const code=name.startsWith("#x")?Number.parseInt(name.slice(2),16):Number.parseInt(name.slice(1),10);
  if(!Number.isInteger(code)||code===0||code>0x10ffff||(code>=0xd800&&code<=0xdfff))return "\ufffd";
  return String.fromCodePoint(code);
 });
}
const nonVisible=new Set(["script","style","template","noscript","iframe","xmp","noembed","noframes","head"]);
const whitespace=c=>c===" "||c==="\t"||c==="\n"||c==="\r"||c==="\f";
function tagEnd(text,start){
 let quote="";
 for(let i=start;i<text.length;i++){
  const c=text[i];
  if(quote){if(c===quote)quote="";continue}
  if(c==="'"||c==='"'){quote=c;continue}
  if(c===">")return i+1;
 }
 return -1;
}
export function evidenceText(value,{separator=" "}={}){
 const text=String(value??"");
 let cursor=0,result="",raw="";
 while(cursor<text.length){
  const start=text.indexOf("<",cursor);
  if(start<0){if(!raw)result+=text.slice(cursor);break}
  if(!raw)result+=text.slice(cursor,start);
  if(raw){
   // Only an actual delimiter after the raw element name closes its content.
   const candidate=text.slice(start,start+raw.length+2).toLowerCase();
   const after=text[start+raw.length+2];
   if(candidate==="</"+raw&&(after===">"||after==="/"||whitespace(after))){
    const end=tagEnd(text,start+raw.length+2);if(end<0)break;
    raw="";result+=separator;cursor=end;continue;
   }
   cursor=start+1;continue;
  }
  if(text.startsWith("<!--",start)){
   const end=text.indexOf("-->",start+4);if(end<0)break;
   result+=separator;cursor=end+3;continue;
  }
  if(text.startsWith("<!",start)||text.startsWith("<?",start)){
   const end=tagEnd(text,start+2);if(end<0)break;
   result+=separator;cursor=end;continue;
  }
  let i=start+1,closing=false;
  if(text[i]==="/"){closing=true;i++}
  const first=text[i];
  if(!first||!/[a-z]/i.test(first)){result+="<";cursor=start+1;continue}
  const begin=i;
  while(i<text.length&&!whitespace(text[i])&&text[i]!=="/"&&text[i]!==">")i++;
  const name=text.slice(begin,i).toLowerCase();
  const end=tagEnd(text,i);if(end<0)break;
  if(!closing&&nonVisible.has(name))raw=name;
  result+=separator;cursor=end;
 }
 return decodeEvidenceEntities(result).replace(/\s+/g," ").trim();
}
/** Compare parsed origins, never a URL substring; reject userinfo. */
export function matchesExactOrigin(value,expected){
 try{
  const a=new URL(value),b=new URL(expected);
  return a.protocol==="https:"&&b.protocol==="https:"&&!a.username&&!a.password&&!b.username&&!b.password&&a.origin===b.origin;
 }catch{return false}
}
