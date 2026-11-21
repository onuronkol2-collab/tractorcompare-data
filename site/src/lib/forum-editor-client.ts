import {forumBlocks} from "./forum-format.mjs";
import type {ForumEditorCopy} from "./forum-editor-i18n.ts";

type Config={url:string;key:string};
type Photo={
 id:string;name:string;signature:string;blob:Blob;preview:string;
 alt:string;reserved:boolean;uploaded:boolean;
};
const MAX_PHOTOS=3,MAX_WEBP=400000,MAX_SOURCE=15*1024*1024;
const types=new Set(["image/jpeg","image/png","image/webp"]);
const make=<K extends keyof HTMLElementTagNameMap>(name:K)=>document.createElement(name);
const delayBlob=(canvas:HTMLCanvasElement,quality:number)=>new Promise<Blob|null>(
 resolve=>canvas.toBlob(resolve,"image/webp",quality)
);
async function decodedImage(file:File):Promise<{source:CanvasImageSource;width:number;height:number;close:()=>void}>{
 if(typeof createImageBitmap==="function"){
  try{
   const bitmap=await createImageBitmap(file);
   return {source:bitmap,width:bitmap.width,height:bitmap.height,close:()=>bitmap.close()};
  }catch{/* Safari fallback for unsupported source */}
 }
 const uri=URL.createObjectURL(file);
 const image=new Image();
 try{
  image.src=uri;
  await image.decode();
  return {source:image,width:image.naturalWidth,height:image.naturalHeight,close:()=>URL.revokeObjectURL(uri)};
 }catch(e){URL.revokeObjectURL(uri);throw e;}
}
export async function prepareForumPhoto(file:File):Promise<Blob>{
 if(!types.has(file.type)||file.size===0||file.size>MAX_SOURCE)throw Error("unsupported");
 const bitmap=await decodedImage(file);
 try{
  if(!bitmap.width||!bitmap.height||bitmap.width*bitmap.height>65000000)
   throw Error("unsupported");
  const canvas=make("canvas"),ctx=canvas.getContext("2d",{alpha:false});
  if(!ctx)throw Error("unsupported");
  const scale=Math.min(1,1600/Math.max(bitmap.width,bitmap.height));
  let width=Math.max(1,Math.round(bitmap.width*scale));
  let height=Math.max(1,Math.round(bitmap.height*scale));
  for(let pass=0;pass<3;pass++){
   canvas.width=width;canvas.height=height;
   // The canvas re-encodes pixels only: GPS, author and camera EXIF are stripped.
   ctx.fillStyle="#fff";ctx.fillRect(0,0,width,height);
   ctx.drawImage(bitmap.source,0,0,width,height);
   for(const quality of [0.82,0.67,0.52]){
    const output=await delayBlob(canvas,quality);
    if(output?.type==="image/webp"&&output.size>0&&output.size<=MAX_WEBP)
     return output;
   }
   width=Math.max(1,Math.round(width*0.78));
   height=Math.max(1,Math.round(height*0.78));
  }
  throw Error("too-large");
 }finally{bitmap.close()}
}
export function initForumEditor(
 widget:HTMLElement,cfg:Config,getToken:()=>string,getUserId:()=>string,say:(text:string)=>void
){
 const root=widget.querySelector<HTMLElement>("[data-forum-editor]");
 const postForm=widget.querySelector<HTMLFormElement>("[data-forum-post]");
 const textarea=postForm?.querySelector<HTMLTextAreaElement>('textarea[name="body"]');
 if(!root||!postForm||!textarea)return null;
 const copy=JSON.parse(root.dataset.editorCopy||"{}") as ForumEditorCopy;
 const $=<T extends HTMLElement>(sel:string)=>root.querySelector<T>(sel);
 const filesInput=$<HTMLInputElement>("[data-editor-files]");
 const photosList=$<HTMLUListElement>("[data-editor-photo-list]");
 const rights=$<HTMLInputElement>("[data-editor-rights]");
 const rightsLabel=$<HTMLElement>("[data-editor-photo-rights]");
 const counter=$<HTMLElement>("[data-editor-count]");
 const previewPanel=$<HTMLElement>("[data-editor-preview-panel]");
 const previewBody=$<HTMLElement>("[data-editor-preview-content]");
 const previewToggle=$<HTMLButtonElement>("[data-editor-preview]");
 const retry=$<HTMLButtonElement>("[data-editor-retry]");
 const status=$<HTMLElement>("[data-editor-status]");
 const photoZone=$<HTMLElement>(".forum-editor-photos");
 let photos:Photo[]=[],processing=0;
 let lastSubmittedId="",lastMode:"topic"|"reply"="topic";
 const setStatus=(text:string)=>{if(status)status.textContent=text};
 function renderCounter(){
  if(!counter)return;
  const words=textarea.value.trim()?textarea.value.trim().split(/\s+/u).length:0;
  counter.textContent=copy.words+": "+words+" · "+copy.characters+": "+Array.from(textarea.value).length+
   "/"+textarea.maxLength;
 }
 const drawSegments=(parts:{type:string;text:string}[],into:HTMLElement)=>{
  for(const piece of parts){
   const el=piece.type==="bold"?make("strong"):piece.type==="italic"?make("em"):
    piece.type==="code"?make("code"):document.createTextNode("");
   if(el.nodeType===3){el.textContent=piece.text;into.appendChild(el);}
   else{el.textContent=piece.text;into.appendChild(el);}
  }
 };
 function drawPreview(){
  if(!previewBody)return;
  previewBody.replaceChildren();
  const blocks=forumBlocks(textarea.value);
  if(!blocks.length){previewBody.textContent=copy.noPreview;return}
  for(const block of blocks){
   const holder=make(block.type==="list"?"ul":block.type==="quote"?"blockquote":"p");
   for(const item of block.items){
    const into=block.type==="list"?make("li"):holder;
    drawSegments(item,into);
    if(block.type==="list")holder.append(into);
   }
   previewBody.append(holder);
  }
 }
 function insertAround(mode:string){
  const start=textarea.selectionStart,end=textarea.selectionEnd;
  const chosen=textarea.value.slice(start,end);
  let before="",after="";
  if(mode==="bold"){before="**";after="**";}
  else if(mode==="italic"){before="*";after="*";}
  else if(mode==="code"){before="`";after="`";}
  else if(mode==="list")before=(start>0&&textarea.value[start-1]!=="\n"?"\n":"")+"- ";
  else if(mode==="quote")before=(start>0&&textarea.value[start-1]!=="\n"?"\n":"")+"> ";
  const replacement=before+chosen+after;
  if(textarea.value.length-chosen.length+replacement.length>textarea.maxLength)return;
  textarea.setRangeText(replacement,start,end,"select");
  textarea.focus();
  const selection=start+before.length;
  textarea.setSelectionRange(selection,selection+chosen.length);
  textarea.dispatchEvent(new Event("input",{bubbles:true}));
 }
 for(const button of root.querySelectorAll<HTMLButtonElement>("[data-editor-format]")){
  button.addEventListener("click",()=>insertAround(button.dataset.editorFormat||""));
 }
 const emojiPopup=$<HTMLDetailsElement>(".forum-emoji");
 for(const button of root.querySelectorAll<HTMLButtonElement>("[data-editor-emoji]")){
  button.addEventListener("click",()=>{
   const emoji=button.dataset.editorEmoji||"";
   if(textarea.value.length+emoji.length>textarea.maxLength)return;
   textarea.setRangeText(emoji,textarea.selectionStart,textarea.selectionEnd,"end");
   textarea.focus();textarea.dispatchEvent(new Event("input",{bubbles:true}));
   if(emojiPopup)emojiPopup.open=false;
  });
 }
 previewToggle?.addEventListener("click",()=>{
  if(!previewPanel)return;
  previewPanel.hidden=!previewPanel.hidden;
  previewToggle.setAttribute("aria-pressed",String(!previewPanel.hidden));
  previewToggle.querySelector<HTMLElement>("span")!.textContent=previewPanel.hidden?copy.preview:copy.write;
  if(!previewPanel.hidden)drawPreview();
 });
 textarea.addEventListener("input",()=>{renderCounter();if(previewPanel&&!previewPanel.hidden)drawPreview()});
 renderCounter();
 function paintPhotos(){
  photosList?.replaceChildren();
  if(rightsLabel)rightsLabel.hidden=photos.length===0;
  if(retry)retry.hidden=!lastSubmittedId||photos.length===0;
  for(let index=0;index<photos.length;index++){
   const photo=photos[index],item=make("li"),img=make("img"),altLabel=make("label");
   img.src=photo.preview;img.alt=photo.alt||copy.photos;img.loading="lazy";
   img.width=320;img.height=240;
   const meta=make("small");meta.textContent=photo.name+" · "+Math.ceil(photo.blob.size/1024)+" KB";
   const altInput=make("input");
   altInput.type="text";altInput.required=true;altInput.minLength=10;altInput.maxLength=160;
   altInput.placeholder=copy.alt;altInput.value=photo.alt;altInput.setAttribute("aria-label",copy.alt);
   altInput.addEventListener("input",()=>{photo.alt=altInput.value;img.alt=photo.alt||copy.photos});
   altLabel.append(make("span"),altInput);
   (altLabel.firstChild as HTMLElement).textContent=copy.alt;
   const remove=make("button");remove.type="button";remove.textContent=copy.remove;
   remove.addEventListener("click",()=>{
    if(photo.reserved){setStatus(copy.photoUploadFailed);return}
    URL.revokeObjectURL(photo.preview);
    photos=photos.filter(x=>x!==photo);paintPhotos();
   });
   item.append(img,meta,altLabel,remove);
   photosList?.append(item);
  }
 }
 async function addFiles(files:File[]){
  if(processing)return;
  const allowed=files.slice(0,MAX_PHOTOS-photos.length);
  if(allowed.length<files.length)setStatus(copy.photoLimit);
  for(const file of allowed){
   const signature=[file.name,file.size,file.lastModified].join(":");
   if(photos.some(x=>x.signature===signature)){setStatus(copy.photoDuplicate);continue}
   processing++;
   setStatus(copy.photoProcessing);
   try{
    const blob=await prepareForumPhoto(file);
    const photo:Photo={id:crypto.randomUUID(),name:file.name,signature,blob,
     preview:URL.createObjectURL(blob),alt:"",reserved:false,uploaded:false};
    photos.push(photo);paintPhotos();setStatus("");
   }catch(e){setStatus(String(e).includes("too-large")?copy.photoTooLarge:copy.photoUnsupported)}
   finally{processing--}
  }
 }
 filesInput?.addEventListener("change",()=>{
  void addFiles(Array.from(filesInput.files||[]));
  filesInput.value="";
 });
 $<HTMLButtonElement>("[data-editor-add-photos]")?.addEventListener("click",()=>filesInput?.click());
 photoZone?.addEventListener("dragover",e=>{if(e.dataTransfer?.types.includes("Files"))e.preventDefault()});
 photoZone?.addEventListener("drop",e=>{
  if(!e.dataTransfer?.files.length)return;
  e.preventDefault();void addFiles(Array.from(e.dataTransfer.files));
 });
 function valid():boolean{
  if(processing){say(copy.photoProcessing);return false}
  if(!photos.length)return true;
  if(!rights?.checked){say(copy.photoRightsRequired);rights?.focus();return false}
  for(const p of photos){
   const length=Array.from(p.alt.trim()).length;
   if(length<10||length>160){say(copy.photoAltRequired);
    photosList?.querySelector<HTMLInputElement>("input")?.focus();return false}
  }
  return true;
 }
 function clear(){
  photos.forEach(x=>URL.revokeObjectURL(x.preview));
  photos=[];lastSubmittedId="";if(rights)rights.checked=false;
  if(retry)retry.hidden=true;paintPhotos();setStatus("");
 }
 async function uploadPhoto(photo:Photo,index:number,postId:string,mode:"topic"|"reply",token:string,userId:string):Promise<boolean>{
  const jsonHeaders={apikey:cfg.key,Authorization:"Bearer "+token,"Content-Type":"application/json"};
  if(!photo.reserved){
   const payload={id:photo.id,topic_id:mode==="topic"?postId:null,
    reply_id:mode==="reply"?postId:null,position:index+1,alt_text:photo.alt.trim(),license_confirmed:true};
   const reserve=await fetch(cfg.url+"/rest/v1/tc_forum_media",{
    method:"POST",headers:{...jsonHeaders,Prefer:"return=minimal"},
    body:JSON.stringify(payload),signal:AbortSignal.timeout(16000)
   });
   if(!reserve.ok)return false;
   photo.reserved=true;
  }
  if(photo.uploaded)return true;
  const path=userId+"/"+photo.id+".webp";
  const uploaded=await fetch(cfg.url+"/storage/v1/object/tc-forum-media/"+path,{
   method:"POST",headers:{apikey:cfg.key,Authorization:"Bearer "+token,
    "Content-Type":"image/webp","x-upsert":"false"},
   body:photo.blob,signal:AbortSignal.timeout(25000)
  });
  if(!uploaded.ok)return false;
  photo.uploaded=true;
  return true;
 }
 async function commit(postId:string,mode:"topic"|"reply"):Promise<boolean>{
  if(!photos.length)return true;
  lastSubmittedId=postId;lastMode=mode;
  let completed=0;
  const token=getToken(),userId=getUserId();
  if(!token||!userId)return false;
  for(let i=0;i<photos.length;i++){
   const p=photos[i];
   try{if(await uploadPhoto(p,i,postId,mode,token,userId))completed++}
   catch{/* Keep unsent private photos for an explicit retry. */}
  }
  if(completed===photos.length){clear();setStatus(copy.photoPending);return true}
  setStatus(copy.photoUploadFailed);
  if(retry)retry.hidden=false;
  return false;
 }
 retry?.addEventListener("click",async()=>{
  if(!lastSubmittedId||retry.disabled)return;
  retry.disabled=true;setStatus(copy.photoProcessing);
  try{
   const ok=await commit(lastSubmittedId,lastMode);
   if(ok)setStatus(copy.photoRetrySuccess);
  }finally{retry.disabled=false}
 });
 return {valid,commit,clear,hasPhotos:()=>photos.length>0};
}
