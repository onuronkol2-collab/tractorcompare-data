// No private data is persisted. These helpers only rank already-visible rows.
export function forumSearchRank(title,body,terms){
 if(!terms.length)return 0;
 const text=String(title??""), rest=String(body??"");
 return terms.reduce((score,term)=>score+(text.includes(term)?4:0)+(rest.includes(term)?1:0),0);
}
export function forumHasNewReply(lastSeenAt,latestReplyAt){
 const seen=Date.parse(lastSeenAt),reply=Date.parse(latestReplyAt);
 return Number.isFinite(seen)&&Number.isFinite(reply)&&reply>seen;
}
export function forumPrivateIds(rows){
 if(!Array.isArray(rows))throw Error("Invalid member list");
 const result=new Map();
 for(const row of rows){
  const id=typeof row?.topic_id==="string"?row.topic_id:"";
  if(!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id))continue;
  result.set(id,typeof row.last_seen_at==="string"?row.last_seen_at:"");
 }
 return result;
}
