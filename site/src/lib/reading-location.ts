/** Keep native fragment navigation and its history. The marker represents
 * the selected location only; no scroll tracking, reading score or storage. */
export function syncReadingLocation(){
 const navs=[...document.querySelectorAll<HTMLElement>("[data-reading-contents]")];
 if(!navs.length)return;
 const links=navs.flatMap(nav=>[...nav.querySelectorAll<HTMLAnchorElement>('a[href^="#"]')]);
 const update=()=>{
  const hash=location.hash;
  for(const link of links){
   if(hash&&link.getAttribute("href")===hash)link.setAttribute("aria-current","location");
   else link.removeAttribute("aria-current");
  }
 };
 update();
 window.addEventListener("hashchange",update);
 window.addEventListener("pageshow",update);
 // On explicit keyboard or pointer return, move focus to the heading.
 // Do not move focus on initial deep links, scroll or browser history.
 for(const link of document.querySelectorAll<HTMLAnchorElement>("[data-reading-return]")){
  link.addEventListener("click",event=>{
   if(event.defaultPrevented||event.button!==0||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return;
   const id=link.getAttribute("href")?.slice(1);
   const target=id?document.getElementById(id):null;
   if(target instanceof HTMLElement)target.focus({preventScroll:true});
  });
 }
}
