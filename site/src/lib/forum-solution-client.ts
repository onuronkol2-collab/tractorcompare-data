import {readForumSession} from "./forum-session-store.mjs";
const uuid=/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i;
type Config={url:string;key:string};
type Copy={accepted:string;choose:string;remove:string;failed:string;loading:string;changed:string;ownerNote:string};
export function solutionId(value:unknown):string{
 if(!Array.isArray(value)||value.length>1)throw Error("Invalid solution response");
 if(!value.length)return "";
 const id=value[0]?.reply_id;
 if(typeof id!=="string"||!uuid.test(id))throw Error("Invalid solution identifier");
 return id;
}
export function initForumSolution(root:HTMLElement){
 let cfg:Config,copy:Copy;
 try{cfg=JSON.parse(root.dataset.solutionConfig||"null");copy=JSON.parse(root.dataset.solutionCopy||"null")}catch{return}
 const topic=root.dataset.solutionTopic||"";
 if(!cfg||!copy||!uuid.test(topic)||!cfg.key||!( /^https:\/\/[a-z0-9-]+\.supabase\.co$/.test(cfg.url) ||
   (cfg.url==="http://127.0.0.1:4173/forum-test-api"&&cfg.key==="inert-browser-fixture"&&new URLSearchParams(location.search).has("live-forum-test"))))return;
 const status=root.querySelector<HTMLElement>("[data-solution-status]");
 const selected=root.querySelector<HTMLAnchorElement>("[data-solution-link]");
 const note=root.querySelector<HTMLElement>("[data-solution-note]");
 const clear=root.querySelector<HTMLButtonElement>("[data-solution-clear]");
 const session=()=>readForumSession()?.access||"";
 let version=0,publicId="",ownId="",ownerToken="",owner=false,busy=false;
 const say=(message:string)=>{if(status)status.textContent=message};
 const query=new URLSearchParams({select:"reply_id",topic_id:"eq."+topic,limit:"2"});
 const path="/rest/v1/tc_forum_accepted_solutions";
 async function api(route:string,token="",init:RequestInit={}){
  const response=await fetch(cfg.url+route,{...init,headers:{apikey:cfg.key,Accept:"application/json",...(token?{Authorization:"Bearer "+token}:cfg.key.split(".").length===3?{Authorization:"Bearer "+cfg.key}:{}),...init.headers},cache:"no-store",signal:AbortSignal.timeout(12000)});
  if(!response.ok)throw Error(String(response.status));
  const text=await response.text();return text?JSON.parse(text):null;
 }
 function render(){
  const active=owner&&!!ownerToken&&ownerToken===session();
  const cards=[...document.querySelectorAll<HTMLElement>("[data-solution-reply-id]")].filter(el=>uuid.test(el.dataset.solutionReplyId||""));
  let selectedCard:HTMLElement|undefined;
  for(const card of cards){
   const id=card.dataset.solutionReplyId||"";
   const accepted=id===publicId;
   if(accepted)selectedCard=card;
   let label=card.querySelector<HTMLElement>("[data-solution-label]");
   if(!label){label=document.createElement("strong");label.dataset.solutionLabel="";label.className="forum-solution-label";card.prepend(label)}
   label.hidden=!accepted;label.textContent=accepted?copy.accepted:"";
   let button=card.querySelector<HTMLButtonElement>("[data-solution-choose]");
   if(!button){button=document.createElement("button");button.type="button";button.dataset.solutionChoose="";button.className="forum-solution-button";card.append(button);button.addEventListener("click",()=>void change(id))}
   button.hidden=!active||id===ownId;button.disabled=busy;button.textContent=copy.choose;
  }
  if(selected){selected.hidden=!selectedCard;if(selectedCard)selected.href="#"+selectedCard.id;selected.textContent=copy.accepted;}
  if(note){note.hidden=!selectedCard;note.textContent=copy.ownerNote;}
  if(clear){clear.hidden=!active||!ownId;clear.disabled=busy;}
  root.hidden=!active&&!selectedCard;
 }
 async function refresh(){
  const current=++version,token=session();
  publicId="";ownId="";ownerToken="";owner=false;render();say("");
  try{
   const value=solutionId(await api(path+"?"+query));
   if(current!==version)return;
   publicId=value;render();
  }catch{return}
  if(!token)return;
  try{
   const user=await api("/auth/v1/user",token);
   if(current!==version||token!==session()||!uuid.test(user?.id||"")||user.is_anonymous!==false)return;
   const params=new URLSearchParams({select:"id",id:"eq."+topic,author_id:"eq."+user.id,status:"eq.published",category:"in.(questions,maintenance)",limit:"1"});
   const rows=await api("/rest/v1/tc_forum_topics?"+params,token);
   if(current!==version||token!==session()||!Array.isArray(rows)||rows.length!==1||rows[0]?.id!==topic)return;
   const value=solutionId(await api(path+"?"+query,token));
   if(current!==version||token!==session())return;
   ownId=value;owner=true;ownerToken=token;render();
  }catch{/* Do not grant a control if the owner check fails. */}
 }
 async function change(reply:string){
  if(busy||!owner||!ownerToken||ownerToken!==session()||(reply&&!uuid.test(reply)))return;
  const token=ownerToken,current=version,previous=ownId;
  if(reply===previous)return;
  busy=true;render();say(copy.loading);
  try{
   const filter="?"+new URLSearchParams({topic_id:"eq."+topic,reply_id:"eq."+previous,select:"reply_id"});
   const insert=!previous&&!!reply;
   const headers={"Content-Type":"application/json",Prefer:"return=representation"};
   const data=await api(insert?path+"?select=reply_id":path+filter,token,reply?
    {method:insert?"POST":"PATCH",headers,body:JSON.stringify(insert?{topic_id:topic,reply_id:reply}:{reply_id:reply})}:
    {method:"DELETE",headers});
   if(current!==version||token!==session())return;
   if(solutionId(data)!==(reply||previous))throw Error("No confirmed change");
   await refresh();if(token===session())say(copy.changed);
  }catch{if(token===session()){await refresh();if(token===session())say(copy.failed)}}
  finally{busy=false;render();}
 }
 clear?.addEventListener("click",()=>void change(""));
 window.addEventListener("tractorvs-forum-session",()=>void refresh());
 document.addEventListener("tractorvs-forum-live-replies-updated",render);
 void refresh();
}
