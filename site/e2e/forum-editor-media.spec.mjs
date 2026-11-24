import {test,expect} from "@playwright/test";

// Real-browser, inert local fixtures. No production credentials, accounts,
// storage objects or public forum posts are created by this test.
test("editor safely formats text, previews emoji, and publishes text while keeping photos private",async({page})=>{
 const currentUser="12a15413-78d6-4dae-a719-5ccf887284b0";
 const posted=[],reserved=[],stored=[];
 const errors=[];
 page.on("pageerror",error=>errors.push(error.message));
 await page.addInitScript(()=>sessionStorage.setItem("tractorvs_forum_access","mock-session"));
 await page.route("**/*",async route=>{
  const req=route.request(),url=new URL(req.url());
  if(url.hostname!=="127.0.0.1")return route.abort();
  if(!url.pathname.startsWith("/forum-test-api/"))return route.continue();
  if(url.pathname.endsWith("/auth/v1/user"))return route.fulfill({json:{id:currentUser}});
  if(url.pathname.endsWith("/auth/v1/settings"))return route.fulfill({json:{external:{google:false,github:false}}});
  if(url.pathname.endsWith("/rest/v1/tc_member_scores")||
     url.pathname.endsWith("/rest/v1/tc_member_profiles")||
     url.pathname.endsWith("/rest/v1/tc_member_bookmarks"))
   return route.fulfill({json:[]});
  if(url.pathname.endsWith("/rest/v1/tc_forum_topics")){
   if(req.method()==="GET")return route.fulfill({json:[]});
   const row=req.postDataJSON();posted.push(row);
   return route.fulfill({status:201,json:[]});
  }
  if(url.pathname.endsWith("/rest/v1/tc_forum_media")){
   const row=req.postDataJSON();reserved.push(row);
   return route.fulfill({status:201,json:[]});
  }
  if(url.pathname.includes("/storage/v1/object/tc-forum-media/")){
   stored.push({url:url.pathname,type:req.headers()["content-type"]});
   return route.fulfill({status:200,json:{Key:url.pathname}});
  }
  return route.fulfill({status:404,json:{message:"Unknown inert test endpoint"}});
 });
 await page.goto("/tr/forum/");
 const reject=page.locator("#tractorvs-analytics-reject");
 if(await reject.isVisible())await reject.click();
 const form=page.locator("#forum-compose [data-forum-post]");
 await expect(form).toBeVisible();
 await form.locator('input[name="title"]').fill("Traktörümün hidrolik pompası hakkında yardım");
 const body=form.locator('textarea[name="body"]');
 await body.fill("Yağ ısındıktan sonra kaldırma sistemi yavaşlıyor ve basınç düşüyor.");
 await body.selectText();
 await form.locator('[data-editor-format="bold"]').click();
 await form.locator(".forum-emoji summary").click();
 await form.locator('[data-editor-emoji="🚜"]').click();
 await form.locator("[data-editor-preview]").click();
 await expect(form.locator("[data-editor-preview-content] strong")).toContainText("Yağ ısındıktan");
 await expect(form.locator("[data-editor-preview-content]")).toContainText("🚜");
 await expect(body).toBeHidden();
 await form.locator("[data-editor-preview]").click();
 await expect(body).toBeVisible();
 const original=await body.inputValue();
 const sample=original+"\n\n## Üretim ülkeleri\n\n| Marka | Ülke |\n|---|---|\n| John Deere | ABD |\n| Deutz-Fahr | Almanya |";
 await body.fill(sample);
 await form.locator("[data-editor-preview]").click();
 await expect(form.locator("[data-editor-preview-content] h2")).toHaveText("Üretim ülkeleri");
 await expect(form.locator("[data-editor-preview-content] table tbody tr")).toHaveCount(2);
 await expect(form.locator("[data-editor-preview-content] th").first()).toHaveCSS("font-weight","800");
 await form.locator("[data-editor-preview]").click();
 await expect(body).toHaveValue(sample);
 await expect(body).toHaveCSS("font-weight","400");
 await body.evaluate(el=>{
  el.setSelectionRange(el.value.length,el.value.length);
  const data=new DataTransfer();data.setData("text/plain","Model\tÜlke\nTD5.90\tTürkiye");
  el.dispatchEvent(new ClipboardEvent("paste",{clipboardData:data,bubbles:true,cancelable:true}));
 });
 await expect(body).toHaveValue(/\| TD5\.90 \| Türkiye \|/);

 await form.locator("[data-editor-preview]").click();
 // Browser must strip original file metadata by re-encoding to WebP.
 const png=Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+Z+HoAAAAASUVORK5CYII=","base64");
 await form.locator("[data-editor-files]").setInputFiles({name:"pump.png",mimeType:"image/png",buffer:png});
 await expect(form.locator("[data-editor-photo-list] li")).toHaveCount(1);
 await form.locator("[data-editor-photo-list] input").fill("Hidrolik yağ pompasının yakın çekim fotoğrafı");
 // Explicit photo rights acknowledgement is required.
 await form.locator('button[type="submit"]').click();
 await expect(page.locator("[data-forum-status]")).toContainText("paylaşma hakkına");
 expect(posted).toHaveLength(0);
 await form.locator("[data-editor-rights]").check();
 await form.locator('button[type="submit"]').click();
 await expect(page.locator("[data-forum-status]")).toContainText("kaydedildi");
 await expect(page.locator("[data-editor-status]")).toContainText("fotoğraflar");
 expect(posted).toHaveLength(1);
 expect(posted[0].status).toBe("published");
 expect(posted[0].id).toMatch(/^[0-9a-f-]{36}$/);
 expect(reserved).toHaveLength(1);
 expect(reserved[0]).toMatchObject({topic_id:posted[0].id,position:1,license_confirmed:true});
 expect(reserved[0].alt_text).toContain("Hidrolik yağ pompası");
 expect(stored).toHaveLength(1);
 expect(stored[0].url).toContain(currentUser+"/"+reserved[0].id+".webp");
 expect(stored[0].type).toBe("image/webp");
 expect(errors).toEqual([]);
});
