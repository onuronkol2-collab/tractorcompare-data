// Pure browsing helpers. Filtering never changes canonical pages or stored content.
export const FORUM_PAGE_SIZE=24;
export function forumBrowseOrder(a,b,mode){
 const time=value=>Date.parse(value)||0;
 const newest=time(b.publishedAt)-time(a.publishedAt);
 if(mode==="popular"){
  // Unknown counts are not evidence of zero replies.
  const count=value=>value===null||!Number.isFinite(value)?-1:value;
  return count(b.replies)-count(a.replies)||newest;
 }
 if(mode==="activity"){
  const activity=value=>Math.max(time(value.publishedAt),time(value.activityAt));
  return activity(b)-activity(a)||newest;
 }
 return newest;
}
export function forumBrowseWindow(rows,limit=FORUM_PAGE_SIZE){
 const bounded=Number.isSafeInteger(limit)&&limit>0?limit:FORUM_PAGE_SIZE;
 return {visible:rows.slice(0,bounded),total:rows.length,more:rows.length>bounded};
}
export function forumModelOptions(rows,locale){
 const models=new Map();
 for(const row of rows){
  if(typeof row.id!=="string"||!(/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i).test(row.id)||
     typeof row.label!=="string"||!row.label.trim())continue;
  if(!models.has(row.id))models.set(row.id,row.label.trim());
 }
 const collator=new Intl.Collator(locale,{numeric:true,sensitivity:"base"});
 return [...models].map(([id,label])=>({id,label})).sort((a,b)=>collator.compare(a.label,b.label)||a.id.localeCompare(b.id));
}
