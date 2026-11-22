/**
 * Read a named attribute from a single HTML opening tag.
 *
 * The previous live SEO parser used /['"]([^'"]+)/ which cut content="Avrupa'da"
 * at the apostrophe. It then incorrectly reported a valid, full forum meta
 * description as "missing". Match the ACTUAL quote delimiter, not any quote.
 * Never execute or rewrite untrusted HTML.
 */
export function readOpeningTagAttribute(tag,target){
 if(typeof tag!=="string"||typeof target!=="string"||!/^[a-z_:][\w:.-]*$/i.test(target))
  return null;
 if(!tag.startsWith("<"))return null;
 let i=1;
 while(i<tag.length&&!/[\s/>]/.test(tag[i]))i++;
 while(i<tag.length){
  while(i<tag.length&&/[\s/]/.test(tag[i]))i++;
  if(i>=tag.length||tag[i]===">")break;
  const start=i;
  while(i<tag.length&&!/[\s=/>]/.test(tag[i]))i++;
  if(i===start){i++;continue;}
  const name=tag.slice(start,i).toLowerCase();
  while(i<tag.length&&/\s/.test(tag[i]))i++;
  let value=null;
  if(tag[i]==="="){
   i++;
   while(i<tag.length&&/\s/.test(tag[i]))i++;
   if(tag[i]==="'"||tag[i]==='"'){
    const quote=tag[i++],begin=i;
    while(i<tag.length&&tag[i]!==quote)i++;
    value=tag.slice(begin,i);
    if(tag[i]===quote)i++;
   }else{
    const begin=i;
    while(i<tag.length&&!/[\s>]/.test(tag[i]))i++;
    value=tag.slice(begin,i);
   }
  }
  if(name===target.toLowerCase())return value;
 }
 return null;
}
