import {differentPublishedEntries,isPublishedSpecList} from "./compare-display.mjs";
/** Optional 2–4 model data layer. Caller supplies only already published catalog
 * records. Values and all source/condition rows stay intact; no numeric ranking.
 * The existing two-model UI does not need to change to use this helper later.
 */
const modelId=/^[a-zA-Z0-9_-]{1,160}$/;
const validId=id=>typeof id==="string"&&modelId.test(id);
const modes=new Set(["all","shared","different"]);
export function multiComparisonRows(models,view="all",locale="en"){
 if(!Array.isArray(models)||models.length<2||models.length>4||!modes.has(view))throw new RangeError("Invalid comparison");
 const ids=new Set(),groups=new Map();
 for(let i=0;i<models.length;i++){
  const model=models[i];
  if(!model||!validId(model.id)||ids.has(model.id)||!isPublishedSpecList(Array.isArray(model.specs)?Array.from(model.specs):model.specs))throw new RangeError("Invalid model");
  ids.add(model.id);
  for(const spec of model.specs){
   let group=groups.get(spec.key);
   if(!group){group={key:spec.key,label:spec.label,cells:Array.from({length:models.length},()=>[])};groups.set(spec.key,group);}
   group.cells[i].push(spec);
  }
 }
 const all=[...groups.values()].map(row=>{
  const shared=row.cells.every(cell=>cell.length>0);
  const different=shared&&row.cells.slice(1).some(cell=>differentPublishedEntries(row.cells[0],cell));
  return {...row,shared,different,present:row.cells.filter(cell=>cell.length>0).length};
 });
 const collator=new Intl.Collator(locale);
 all.sort((a,b)=>collator.compare(a.label,b.label)||a.key.localeCompare(b.key,"en"));
 return {ids:[...ids],total:all.length,shared:all.filter(r=>r.shared).length,different:all.filter(r=>r.different).length,rows:all.filter(r=>view==="all"||(view==="shared"?r.shared:r.different))};
}
/** Preserve the old left/right URL contract; add third/fourth only on opt-in.
 * Strict origin/path checks ensure this cannot share arbitrary external targets.
 */
export function multiComparisonShareUrl(href,ids,view="all"){
 if(!Array.isArray(ids)||ids.length<2||ids.length>4||!Array.from(ids).every(validId)||new Set(ids).size!==ids.length||!modes.has(view))return null;
 try{
  const url=new URL(href);
  if(url.origin!=="https://tractorvs.com"||url.username||url.password||!/^\/(?:tr\/|zh\/|hi\/|pt-br\/|fr\/|de\/|ru\/|ja\/|es\/)?compare\/$/.test(url.pathname))return null;
  url.search="";url.hash="";
  ids.forEach((id,i)=>url.searchParams.set(["left","right","third","fourth"][i],id));
  if(view!=="all")url.searchParams.set("view",view);
  return url.href;
 }catch{return null;}
}
