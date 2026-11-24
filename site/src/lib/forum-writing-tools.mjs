// Pure editing operations: preserve all selected content and existing stored markup.
export function forumBlockInsertion(value,start,end,mode,labels,limit){
 const text=String(value??"");
 if(!Number.isInteger(start)||!Number.isInteger(end)||start<0||end<start||end>text.length)return null;
 const selected=text.slice(start,end);
 const prefix=start>0&&!text.slice(0,start).endsWith("\n\n")?(text[start-1]==="\n"?"\n":"\n\n"):"";
 const suffix=end<text.length&&!text.slice(end).startsWith("\n\n")?(text[end]==="\n"?"\n":"\n\n"):"";
 let inserted,selectionStart=0,selectionEnd=0;
 if(mode==="heading"){
  // A heading is a single line. Don't flatten or discard a multiline selection.
  if(/[\r\n]/.test(selected)||selected.length>250)return null;
  const title=selected||labels.headingPlaceholder;
  inserted="## "+title;
  selectionStart=3;selectionEnd=inserted.length;
 }else if(mode==="table"){
  // Inserting a template must never overwrite previously selected content.
  if(selected)return null;
  const first=labels.column+" 1",second=labels.column+" 2";
  inserted="| "+first+" | "+second+" |\n| --- | --- |\n| "+labels.cell+" | "+labels.cell+" |";
  selectionStart=2;selectionEnd=2+first.length;
 }else return null;
 const replacement=prefix+inserted+suffix;
 if(text.length-(end-start)+replacement.length>limit)return null;
 return {replacement,selectionStart:start+prefix.length+selectionStart,selectionEnd:start+prefix.length+selectionEnd};
}
