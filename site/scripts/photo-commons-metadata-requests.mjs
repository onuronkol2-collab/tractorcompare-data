/** Generate a bounded list of exact file metadata requests for the existing trusted Commons client.
 * No network; no publication or permissions. Call only inside the existing shared Commons cooldown lane. */
import {readFile,writeFile} from 'node:fs/promises';
export function planMetadataRequests(leads,limit=12){
 if(!Array.isArray(leads)||!Number.isSafeInteger(limit)||limit<1||limit>50)throw Error('invalid request input');
 const requests=new Map();
 for(const lead of leads){
  if(lead.previous_rejection||typeof lead.source!=='string')continue;
  let u;try{u=new URL(lead.source);}catch{continue;}
  if(u.protocol!=='https:'||u.hostname!=='commons.wikimedia.org'||u.username||u.password||u.port||u.search||u.hash||!u.pathname.startsWith('/wiki/File:'))continue;
  let name;try{name=decodeURIComponent(u.pathname.slice('/wiki/File:'.length)).replaceAll(' ','_');}catch{continue;}
  if(!name||name.length>250||/[\/\\|\x00-\x1f]/.test(name))continue;
  if(requests.has(name))continue;
  if(requests.size>=limit)break;
  const api=new URL('https://commons.wikimedia.org/w/api.php');
  for(const [k,v] of Object.entries({action:'query',format:'json',formatversion:'2',prop:'imageinfo',iiprop:'url|sha1|size|mime|extmetadata',iiextmetadatafilter:'Artist|Credit|LicenseShortName|LicenseUrl|Restrictions|Attribution|AttributionRequired',titles:'File:'+name,maxlag:'5'}))api.searchParams.set(k,v);
  requests.set(name,{source:lead.source,url:api.href,filename:name,publicationAuthorized:false});
 }
 return [...requests.values()];
}
// Deliberately a request plan, not a second independent Commons downloader.
if(process.argv[1]&&import.meta.url===new URL('file://'+process.argv[1]).href){
 const [input,output]=process.argv.slice(2);if(!input||!output)throw Error('usage: script leads.json request-plan.json');
 const d=JSON.parse(await readFile(input,'utf8'));await writeFile(output,JSON.stringify({publicationAuthorized:false,requests:planMetadataRequests(d.candidates)},null,2)+'\n',{mode:0o600,flag:'wx'});
}
