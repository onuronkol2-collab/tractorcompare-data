import {test,expect} from "@playwright/test";
import {readFileSync} from "node:fs";
import {stripTypeScriptTypes} from "node:module";
// Exercise the actual browser client in an inert DOM; the regular preview build
// intentionally has no production forum records or credentials.
const read=name=>readFileSync(new URL("../src/lib/"+name,import.meta.url),"utf8");
const withoutModules=source=>source.replace(/^import .*;\s*$/gm,"").replace(/^export /gm,"");
const client=[
 withoutModules(read("forum-thread-tools.mjs")),
 withoutModules(stripTypeScriptTypes(read("forum-thread-tools-i18n.ts"))),
 withoutModules(stripTypeScriptTypes(read("forum-thread-tools-client.ts"))),
 'initForumThreadTools(document.querySelector("[data-thread-tools-lang]"));'
].join("\n");
const id="reply-11111111-2222-4333-8444-555555555555";
test("thread tools retain drafts, search replies, share exact links and include new live replies",async({page})=>{
 await page.setContent(`<main data-thread-tools-lang="tr" data-thread-canonical="https://tractorvs.com/tr/forum/test-topic-12345/">
 <div class="forum-public-tools"><button data-thread-action="copy-topic">Copy</button><button data-thread-action="print">Print</button></div>
 <div class="forum-thread-feedback" data-thread-js hidden><p data-thread-tools-status></p><input data-thread-copy-fallback hidden readonly></div>
 <div data-thread-reply-filter hidden><input data-thread-reply-search><button data-thread-action="clear">Clear</button><p data-thread-filter-status></p></div>
 <article id="${id}" data-static-reply-id="1"><div data-thread-reply-body><p>Hidrolik pompa basıncı</p></div><div class="forum-reply-tools"><button data-thread-action="quote">Quote</button><button data-thread-action="copy-reply">Copy reply</button></div></article>
 <article id="reply-22222222-2222-4333-8444-555555555555" data-static-reply-id="2"><div data-thread-reply-body><p>Lastik ölçüsü</p></div></article>
 <div data-live-reply-grid></div>
 <section id="forum-compose" tabindex="-1"><details data-forum-auth-gate><summary>Login</summary></details><form data-forum-post hidden><textarea name="body" maxlength="6000">Mevcut taslak</textarea></form></section>
 </main>`);
 await page.evaluate(()=>{
  Object.defineProperty(navigator,"clipboard",{configurable:true,value:{writeText:async value=>{window.copiedUrl=value}}});
  window.print=()=>{window.printed=true};
 });
 await page.addScriptTag({content:client});
 await page.locator('[data-thread-action="copy-topic"]').click();
 await expect.poll(()=>page.evaluate(()=>window.copiedUrl)).toBe("https://tractorvs.com/tr/forum/test-topic-12345/");
 await page.locator('[data-thread-action="copy-reply"]').click();
 await expect.poll(()=>page.evaluate(()=>window.copiedUrl)).toBe("https://tractorvs.com/tr/forum/test-topic-12345/#"+id);
 await page.locator('[data-thread-action="print"]').click();
 expect(await page.evaluate(()=>window.printed)).toBe(true);
 await page.locator('[data-thread-action="quote"]').click();
 await expect(page.locator("[data-forum-auth-gate]")).toHaveAttribute("open","");
 await page.locator("[data-forum-post]").evaluate(form=>form.hidden=false);
 await page.locator('[data-thread-action="quote"]').click();
 await expect(page.locator("textarea")).toHaveValue(/Mevcut taslak\s+> Hidrolik pompa basıncı/);
 await expect(page.locator("textarea")).toHaveValue(new RegExp(id));
 const search=page.locator("[data-thread-reply-search]");
 await search.fill("pompa");
 await expect(page.locator("[data-static-reply-id]").nth(0)).toBeVisible();
 await expect(page.locator("[data-static-reply-id]").nth(1)).toBeHidden();
 await page.locator("[data-live-reply-grid]").evaluate(grid=>{
  const article=document.createElement("article");article.id="reply-33333333-2222-4333-8444-555555555555";article.className="forum-live-reply";
  const body=document.createElement("div");body.lang="tr";const p=document.createElement("p");p.textContent="Pompa filtresi";body.append(p);article.append(body);grid.append(article);
 });
 await expect(page.locator(".forum-live-reply [data-thread-action='quote']")).toBeVisible();
 await expect(page.locator("[data-thread-filter-status]")).toContainText("2/3");
 await page.locator('[data-thread-action="clear"]').click();
 await expect(page.locator("[data-static-reply-id]").nth(1)).toBeVisible();
});
