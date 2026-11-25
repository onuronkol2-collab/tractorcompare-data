import {test,expect} from "@playwright/test";
import {readFileSync} from "node:fs";
import {stripTypeScriptTypes} from "node:module";
const source=readFileSync(new URL("../src/components/ForumTopic.astro",import.meta.url),"utf8");
const client=stripTypeScriptTypes(source.slice(source.indexOf('const community=document.querySelector<HTMLElement>("[data-thread-engagement]");'),source.lastIndexOf("</script>")));
test("old member responses cannot restore private topic engagement after account switch",async({page})=>{
 await page.setContent(`<div data-thread-engagement data-thread-id="11111111-1111-4111-8111-111111111111" data-thread-config='{"url":"https://example.invalid","key":"inert"}' data-thread-copy='{"topicLike":"Like","topicUnlike":"Unlike","saveTopic":"Save","removeTopic":"Remove","followTopic":"Follow","unfollowTopic":"Unfollow","helpfulButton":"Helpful","unhelpfulButton":"Undo","voteLogin":"Login","voteError":"Error"}'><button data-like-toggle></button><button data-bookmark-toggle></button><button data-follow-toggle></button><span data-thread-like-count></span><span data-thread-read-count></span><span data-engagement-status></span></div><div data-helpful-reply data-reply-id="22222222-2222-4222-8222-222222222222"><button data-helpful-toggle></button><span data-helpful-count></span></div>`);
 await page.evaluate(()=>{
  window.currentToken="old";
  window.readForumSession=()=>({access:window.currentToken});
  window.fetch=async (url,init)=>{
   const path=new URL(url).pathname;
   const token=init.headers.Authorization;
   const json=value=>new Response(JSON.stringify(value),{status:200});
   if(path.endsWith("/auth/v1/user"))return json({id:token==="Bearer old"?"33333333-3333-4333-8333-333333333333":"44444444-4444-4444-8444-444444444444"});
   if(path.endsWith("/tc_member_bookmarks")&&token==="Bearer old")return await new Promise(resolve=>{window.resolveOld=()=>resolve(json([{topic_id:"11111111-1111-4111-8111-111111111111"}]))});
   if(path.endsWith("/tc_forum_topic_member_reads")){window.readRecorded=true;return new Response(null,{status:204})}
   return json([]);
  };
 });
 await page.addScriptTag({content:client});
 await expect.poll(()=>page.evaluate(()=>typeof window.resolveOld)).toBe("function");
 await page.evaluate(()=>{window.currentToken="new";window.dispatchEvent(new Event("tractorvs-forum-session"))});
 await expect.poll(()=>page.evaluate(()=>window.readRecorded)).toBe(true);
 await page.evaluate(()=>window.resolveOld());
 await expect(page.locator("[data-bookmark-toggle]")).toHaveAttribute("aria-pressed","false");
 await expect(page.locator("[data-like-toggle]")).toHaveAttribute("aria-pressed","false");
 await expect(page.locator("[data-follow-toggle]")).toHaveAttribute("aria-pressed","false");
 await expect(page.locator("[data-helpful-toggle]")).toHaveAttribute("aria-pressed","false");
});
