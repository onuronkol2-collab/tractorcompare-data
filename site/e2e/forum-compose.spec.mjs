import {test,expect} from "@playwright/test";

test("sign in, recover a draft, submit for moderation and check its status",async({page})=>{
 const posted=[];
 let expired=false;
 let limited=true;
 let verifiedCode="";
 let currentUser="user-a";
 await page.route("**/*",async route=>{
  const request=route.request();
  const url=new URL(request.url());
  if(url.hostname!=="127.0.0.1")return route.abort();
  if(!url.pathname.startsWith("/forum-test-api/"))return route.continue();
  if(url.pathname.endsWith("/auth/v1/user"))return route.fulfill({json:{id:currentUser}});
  if(url.pathname.endsWith("/auth/v1/otp"))return route.fulfill({json:{}});
  if(url.pathname.endsWith("/auth/v1/verify")){
   verifiedCode=request.postDataJSON().token;
   return route.fulfill({json:{access_token:"mock-session"}});
  }
  if(url.pathname.endsWith("/auth/v1/logout"))return route.fulfill({status:204});
  expect(url.pathname).toBe("/forum-test-api/rest/v1/tc_forum_topics");
  expect(request.headers().authorization).toBe("Bearer mock-session");
  if(request.method()==="GET"){
   expect(url.searchParams.get("author_id")).toBe("eq."+currentUser);
   return route.fulfill({json:posted.filter(row=>row.user===currentUser)});
  }
  if(expired){expired=false;return route.fulfill({status:401,json:{}})}
  if(limited){limited=false;return route.fulfill({status:400,json:{message:"Daily forum topic limit reached"}})}
  posted.push({...request.postDataJSON(),user:currentUser});
  return route.fulfill({status:201});
 });
 await page.goto("/tr/forum/");
 const reject=page.locator("#tractorvs-analytics-reject");
 if(await reject.isVisible())await reject.click();
 const compose=page.locator("#forum-compose");
 const post=compose.locator("[data-forum-post]");
 const auth=compose.locator("[data-forum-email]");
 const verify=compose.locator("[data-forum-verify]");
 async function signIn(){
  await auth.locator("input").fill("tester@example.invalid");
  await auth.locator("button").click();
  await verify.locator("input").fill("123456");
  await verify.locator("button").click();
  await expect(post).toBeVisible();
 }
 await page.locator('a[href="#forum-compose"]').click();
 await signIn();
 expect(verifiedCode).toBe("123456");
 const title="Hidrolik basıncı yağ ısınınca değişiyor";
 const body="Soğuk çalışmada gördüğüm değer ile yağ ısındıktan sonraki değer farklı.";
 await post.locator('[name="title"]').fill(title);
 await post.locator("textarea").fill(body);
 await post.locator('[name="source_locale"]').selectOption("de");
 await page.reload();
 await expect(post.locator("textarea")).toHaveValue(body);
 await expect(post.locator('[name="source_locale"]')).toHaveValue("de");
 await post.locator("button").click();
 const status=compose.locator("[data-forum-status]");
 await expect(status).toHaveText("Son 24 saat için gönderi sınırına ulaştın.");
 expired=true;
 await post.locator("button").click();
 await expect(auth).toBeVisible();
 await signIn();
 await expect(post.locator("textarea")).toHaveValue(body);
 await post.locator("button").click();
 await expect(post.locator("textarea")).toHaveValue("");
 expect(posted).toHaveLength(1);
 expect(posted[0]).toMatchObject({title,body,status:"pending",locale:"de",translation_consent:false});
 await compose.locator("summary").click();
 await expect(compose.locator("[data-history-list]")).toContainText(title+" · İncelemede");
 await post.locator("textarea").fill("Private draft for user A");
 await compose.locator("[data-forum-logout]").click();
 currentUser="user-b";
 await signIn();
 await expect(post.locator("textarea")).toHaveValue("");
 await compose.locator("summary").click();
 await expect(compose.locator("[data-history-status]")).toHaveText("Burada henüz gönderin yok.");
});
