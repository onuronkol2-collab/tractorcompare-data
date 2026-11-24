import {forumSearchText} from "./forum-search.mjs";

// Pure public-data helpers shared by the forum hub and topic pages.
export function forumSearchTerms(query,locale){
 return [...new Set(forumSearchText(String(query??"").slice(0,200),locale).trim().split(/\s+/u).filter(Boolean))].slice(0,20);
}
export function matchesForumTerms(text,terms){
 return terms.every(term=>String(text??"").includes(term));
}
export function forumActivityByTopic(replies){
 const dates=new Map();
 for(const row of replies){
  if(row.status!=="published"||row.machine_translated||row.locale!==row.original_locale)continue;
  const time=Date.parse(row.created_at);
  if(!Number.isFinite(time))continue;
  const previous=dates.get(row.topic_id);
  if(!previous||time>Date.parse(previous))dates.set(row.topic_id,row.created_at);
 }
 return dates;
}
export function latestForumActivity(created,replyDate){
 return Date.parse(replyDate)>Date.parse(created)?replyDate:created;
}
export function relatedForumTopics(topic,rows,limit=4){
 const candidates=rows.filter(row=>row.status==="published"&&row.locale===topic.locale&&row.topic_id!==topic.topic_id);
 const score=row=>(topic.tractor_id&&row.tractor_id===topic.tractor_id?4:0)+(row.category===topic.category?1:0);
 return candidates.filter(row=>score(row)>0).sort((a,b)=>score(b)-score(a)||Date.parse(b.created_at)-Date.parse(a.created_at)||a.slug.localeCompare(b.slug)).slice(0,limit);
}

/** Convert only unambiguous rectangular plain-text spreadsheet selections.
 * Never interpret HTML or discard cells. Unsupported shapes stay plain text.
 */
export function forumSpreadsheetMarkdown(value){
 const text=String(value??"").replace(/\r\n?/g,"\n").replace(/\n$/,"");
 const rows=text.split("\n").map(line=>line.split("\t"));
 const columns=rows[0]?.length||0;
 if(rows.length<2||rows.length>81||columns<2||columns>8||
    rows.some(row=>row.length!==columns||row.some(cell=>/[|"<>]/.test(cell)||cell!==cell.trim()))||
    rows[0].some(cell=>!cell))return null;
 const format=row=>"| "+row.join(" | ")+" |";
 return [format(rows[0]),format(Array(columns).fill("---")),...rows.slice(1).map(format)].join("\n");
}
