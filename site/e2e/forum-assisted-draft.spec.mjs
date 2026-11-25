import {test,expect} from "@playwright/test";

test("assisted draft import preserves account, existing draft and explicit publication",async({page})=>{
 const posted=[];
 await page.route("**/forum-test-api/**",async route=>{
  const req=route.request(),url=new URL(req.url());
  if(url.pathname.endsWith("/auth/v1/user"))return route.fulfill({json:{id:"draft-import-user"}});
  if(url.pathname.endsWith("/auth/v1/settings"))return route.fulfill({json:{external:{google:false,github:false}}});
  if(url.pathname.endsWith("/auth/v1/logout"))return route.fulfill({status:204});
  if(url.pathname.endsWith("/rest/v1/tc_forum_topics")&&req.method()==="POST"){
   expect(req.headers().authorization).toBe("Bearer test-only");
   posted.push(req.postDataJSON());return route.fulfill({status:201});
  }
  return route.fulfill({json:[]});
 });
 await page.goto("/tr/forum/");
 const reject=page.locator("#tractorvs-analytics-reject");
 if(await reject.isVisible())await reject.click();
 const post=page.locator("#forum-compose [data-forum-post]");
 const file=post.locator("[data-assisted-draft-file]");
 const status=page.locator("#forum-compose [data-forum-status]");
 await expect(file).toBeHidden();
 await page.goto("/tr/forum/?draft-test=1#access_token=test-only");
 await expect(file).toBeVisible();
 const draft={version:1,title:"Hidrolik bakım hakkında teknik sorular",body:"Traktör hidrolik sistemleri hakkında kaynaklı bir forum taslağı.",locale:"tr",category:"maintenance"};
 async function upload(data){await file.setInputFiles({name:"draft.json",mimeType:"application/json",buffer:Buffer.from(JSON.stringify(data))});}
 await upload({...draft,author_id:"someone-else"});
 await expect(status).toHaveText("Geçersiz taslak.");
 await expect(post.locator('[name="title"]')).toHaveValue("");
 await post.locator('[name="title"]').fill("Korunması gereken eski taslak");
 await upload(draft);
 await expect(status).toHaveText("Önce mevcut taslağını temizle.");
 await expect(post.locator('[name="title"]')).toHaveValue("Korunması gereken eski taslak");
 await post.locator('[name="title"]').fill("");
 await post.locator('[name="translation_consent"]').check();
 await upload(draft);
 await expect(status).toHaveText("Taslak aktarıldı. İncele.");
 await expect(post.locator('[name="title"]')).toHaveValue(draft.title);
 await expect(post.locator('textarea[name="body"]')).toHaveValue(draft.body);
 await expect(post.locator('[name="category"]')).toHaveValue("maintenance");
 await expect(post.locator('[name="translation_consent"]')).not.toBeChecked();
 expect(posted).toHaveLength(0);
 await post.locator('button[type="submit"]').click();
 await expect(post.locator('[name="title"]')).toHaveValue("");
 expect(posted).toHaveLength(1);
 expect(posted[0]).toMatchObject({title:draft.title,body:draft.body,locale:"tr",category:"maintenance",translation_consent:false,status:"published"});
 expect(posted[0]).not.toHaveProperty("author_id");
});
