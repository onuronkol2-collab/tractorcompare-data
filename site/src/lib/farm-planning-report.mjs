/** Plain text report only: no storage, network, HTML or publication side effects. */
function clean(value,max,allowEmpty=false){
 if(typeof value!=="string"||value.length>max)throw new RangeError("Invalid report text");
 const out=value.replace(/[\r\n\t]+/g," ").trim();
 if(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(out)||(!allowEmpty&&!out))throw new RangeError("Invalid report text");
 return out;
}
export function buildPlanningReport(title,note,blocks){
 if(!Array.isArray(blocks)||blocks.length<1||blocks.length>12)throw new RangeError("Invalid report sections");
 const lines=["TractorVS — "+clean(title,500),"",clean(note,4000),""];
 let count=0;
 for(const block of blocks){
  if(!block||!Array.isArray(block.entries)||block.entries.length<1||block.entries.length>30)throw new RangeError("Invalid report entries");
  const heading=clean(block.title,300,true);if(heading)lines.push(heading);
  for(const pair of block.entries){
   if(!Array.isArray(pair)||pair.length!==2)throw new RangeError("Invalid report entry");
   lines.push(clean(pair[0],500)+": "+clean(pair[1],500));count++;
  }
  lines.push("");
 }
 if(count>150)throw new RangeError("Too many report entries");
 return lines.join("\n");
}
