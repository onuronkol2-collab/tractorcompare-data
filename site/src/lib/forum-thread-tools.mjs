// Pure helpers shared by UI and regression tests.
const replyId=/^reply-[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i;
export function discussionLink(canonical,id=""){
 const url=new URL(canonical);
 if(url.protocol!=="https:"||url.hostname!=="tractorvs.com"||url.port||url.username||url.password||
    !/^\/(?:[a-z]{2}(?:-[a-z]{2})?\/)?forum\/[^/]+\/$/.test(url.pathname))throw Error("Invalid public topic URL");
 if(id&&!replyId.test(id))throw Error("Invalid reply anchor");
 url.search="";url.hash=id;
 return url.href;
}
export function replyMatches(text,query,locale){
 const normalized=(value)=>String(value??"").normalize("NFKC").toLocaleLowerCase(locale).replace(/\s+/gu," ").trim();
 const search=normalized(query).slice(0,160);
 return !search||search.split(" ").every(term=>normalized(text).includes(term));
}
export function appendReplyQuote(draft,body,url,maxLength){
 const text=String(body??"").replace(/\s+/gu," ").trim();
 if(!text)return null;
 const chars=Array.from(text);
 const excerpt=chars.slice(0,320).join("")+(chars.length>320?"…":"");
 const prefix=draft&&!draft.endsWith("\n\n")?(draft.endsWith("\n")?"\n":"\n\n"):"";
 const result=draft+prefix+"> "+excerpt+"\n> "+url+"\n\n";
 return result.length<=maxLength?result:null;
}
