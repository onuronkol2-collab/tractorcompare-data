import {test,expect} from "@playwright/test";

test("sign in, recover a draft, publish directly and check its status",async({page})=>{
 // Three sign-ins, a reload, several posts and a publication probe share this test.
 // Bound the whole journey separately from each UI assertion/network operation.
 test.setTimeout(90000);
 const posted=[];
 const sessions=new Map();
 let nextSession=0;
 let expired=false;
 let limited=true;
 let articleLive=false;
 let articleNoindex=false;
 let verifiedCode="";
 let currentUser="user-a";
 await page.route("**/*",async route=>{
  const request=route.request();
  const url=new URL(request.url());
  if(url.hostname!=="127.0.0.1")return route.abort();
  if(url.pathname.startsWith("/de/forum/")){
   if(!articleLive)return route.fulfill({status:404,body:"Not yet deployed"});
   const canonical=url.toString();
   return route.fulfill({status:200,contentType:"text/html",
    body:'<html><head><link rel="canonical" href="'+canonical+'"><meta name="robots" content="'+(articleNoindex?"noindex,nofollow":"index,follow,max-image-preview:large")+'"></head><body><h1>Tractor Topic</h1></body></html>'});
  }
  if(!url.pathname.startsWith("/forum-test-api/"))return route.continue();
  const bearer=request.headers().authorization?.replace(/^Bearer /,"");
  const sessionUser=sessions.get(bearer);
  if(url.pathname.endsWith("/auth/v1/user"))return sessionUser?route.fulfill({json:{id:sessionUser}}):route.fulfill({status:401,json:{}});
  if(url.pathname.endsWith("/auth/v1/otp"))return route.fulfill({json:{}});
  if(url.pathname.endsWith("/auth/v1/verify")){
   verifiedCode=request.postDataJSON().token;
   const issued="mock-session-"+(++nextSession);
   sessions.set(issued,currentUser);
   return route.fulfill({json:{access_token:issued}});
  }
  if(url.pathname.endsWith("/auth/v1/logout")){sessions.delete(bearer);return route.fulfill({status:204});}
  if(url.pathname.endsWith("/auth/v1/settings"))return route.fulfill({json:{external:{google:false,github:false}}});
  if(["/forum-test-api/rest/v1/tc_member_scores","/forum-test-api/rest/v1/tc_member_profiles","/forum-test-api/rest/v1/tc_member_bookmarks"].includes(url.pathname))return route.fulfill({json:[]});
  if(url.pathname.endsWith("/rest/v1/tc_forum_assisted_eligible")){
   expect(request.method()).toBe("GET");
   expect(sessionUser).toBeTruthy();
   expect(url.searchParams.get("select")).toBe("owner_id");
   return route.fulfill({json:[]});
  }
  expect(url.pathname).toBe("/forum-test-api/rest/v1/tc_forum_topics");
  expect(sessionUser).toBeTruthy();
  if(request.method()==="GET"){
   if(url.searchParams.has("id")){
    const id=url.searchParams.get("id")?.replace(/^eq\./,"");
    return route.fulfill({json:posted.filter(row=>row.user===sessionUser&&row.id===id)});
   }
   expect(url.searchParams.get("author_id")).toBe("eq."+sessionUser);
   return route.fulfill({json:posted.filter(row=>row.user===sessionUser)});
  }
  if(expired){expired=false;sessions.delete(bearer);return route.fulfill({status:401,json:{}})}
  if(limited){limited=false;return route.fulfill({status:400,json:{message:"Daily forum topic limit reached"}})}
  posted.push({...request.postDataJSON(),user:sessionUser});
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
  if(!(await compose.locator("[data-forum-auth-gate]").evaluate(el=>el.open)))
   await compose.locator("[data-forum-auth-gate] > summary").click();
  if(!await auth.isVisible())await compose.locator("[data-email-choice] summary").click();
  await auth.locator("input").fill(currentUser+"@example.invalid");
  const otp=page.waitForResponse(res=>new URL(res.url()).pathname.endsWith("/auth/v1/otp")&&res.request().method()==="POST",{timeout:15000});
  await auth.locator("button").click();
  expect((await otp).ok()).toBeTruthy();
  await expect(compose.locator("[data-mail-step]")).toBeVisible();
  await expect(verify.locator("input")).toBeHidden();
  await compose.locator("[data-code-option] summary").click();
  await verify.locator("button").click();
  await expect(verify.locator("input")).toBeFocused();
  await verify.locator("input").fill("123456");
  const verification=page.waitForResponse(res=>new URL(res.url()).pathname.endsWith("/auth/v1/verify")&&res.request().method()==="POST",{timeout:15000});
  await verify.locator("button").click();
  expect((await verification).ok()).toBeTruthy();
  await expect(post).toBeVisible();
  await expect(compose.locator("[data-forum-auth-gate]")).toBeHidden();
  await expect(compose.locator("[data-forum-history]")).toBeVisible();
 }
 await page.locator('.community-hero-links a[href="#forum-compose"]').click();
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
 await post.locator('button[type="submit"]').click();
 const status=compose.locator("[data-forum-status]");
 await expect(status).toHaveText("Son 24 saat için gönderi sınırına ulaştın.");
 expired=true;
 await post.locator('button[type="submit"]').click();
 await expect(compose.locator("[data-forum-auth-gate] > summary")).toBeVisible();
 await signIn();
 await expect(post.locator("textarea")).toHaveValue(body);
 await post.locator('button[type="submit"]').click();
 await expect(post.locator("textarea")).toHaveValue("");
 expect(posted).toHaveLength(1);
 expect(posted[0]).toMatchObject({title,body,status:"published",locale:"de",translation_consent:false});
 await expect(compose.locator("[data-forum-publication-panel]")).toBeVisible();
 await expect(compose.locator("[data-forum-publication-status]")).toContainText("henüz");
 await expect(compose.locator("[data-forum-publication-link]")).toBeHidden();
 articleLive=true;
 await compose.locator("[data-forum-publication-check]").click();
 await expect(compose.locator("[data-forum-publication-link]")).toBeVisible();
 await expect(compose.locator("[data-forum-publication-status]")).toContainText("herkese açık");
 articleNoindex=true;
 await compose.locator("[data-forum-publication-check]").click();
 await expect(compose.locator("[data-forum-publication-link]")).toBeVisible();
 await expect(compose.locator("[data-forum-publication-status]")).toContainText("herkese açık");
 await compose.locator("[data-forum-history] summary").click();
 await expect(compose.locator("[data-history-list]")).toContainText(title+" · Yayında");
 await post.locator("textarea").fill("Private draft for user A");
 const logoutResponse=page.waitForResponse(res=>new URL(res.url()).pathname.endsWith("/auth/v1/logout")&&res.request().method()==="POST",{timeout:15000});
 await compose.locator("[data-forum-logout]").click();
 expect((await logoutResponse).status()).toBe(204);
 await expect(post).toBeHidden();
 await expect(compose.locator("[data-forum-history]")).toBeHidden();
 await expect(compose.locator("[data-history-list]")).toBeEmpty();
 currentUser="user-b";
 await signIn();
 await expect(post.locator("textarea")).toHaveValue("");
 await compose.locator("[data-forum-history] summary").click();
 await expect(compose.locator("[data-history-status]")).toHaveText("Burada henüz gönderin yok.");
});

test("an email link opens the editor and an expired link offers a fresh start",async({page})=>{
 await page.route("**/forum-test-api/auth/v1/user",route=>route.fulfill({json:{id:"test-user"}}));
 await page.goto("/tr/forum/#error=access_denied&error_code=otp_expired");
 await expect(page.locator("[data-forum-status]")).toContainText("geçersiz");
 await expect(page.locator("[data-forum-expired-help]")).toBeVisible();
 await expect(page.locator("[data-forum-register]")).toBeVisible();
 await page.goto("/tr/forum/?return-test=1#access_token=test-only");
 await expect(page.locator("[data-forum-post]")).toBeVisible();
 await expect(page).not.toHaveURL(/access_token/);
});

test("guest compose link reveals the login gate on click and direct link",async({page})=>{
  await page.goto("/tr/forum/",{waitUntil:"domcontentloaded"});
  const composer=page.locator("#forum-compose");
  const gate=composer.locator("[data-forum-auth-gate]");
  const post=composer.locator("[data-forum-post]");
  await expect(gate).toBeVisible();
  await expect(gate).not.toHaveAttribute("open","");
  await expect(post).toBeHidden();

  await page.locator('a[href="#forum-compose"]').first().click();
  await expect(page).toHaveURL(/#forum-compose$/);
  await expect(gate).toHaveAttribute("open","");
  await expect(composer.locator("[data-forum-register]")).toBeVisible();
  await expect(post).toBeHidden();

  // Repeated selection of an unchanged fragment must also reveal the gate.
  await gate.locator(":scope > summary").click();
  await expect(gate).not.toHaveAttribute("open","");
  await page.locator('a[href="#forum-compose"]').first().click();
  await expect(gate).toHaveAttribute("open","");

  await page.reload({waitUntil:"domcontentloaded"});
  await expect(gate).toHaveAttribute("open","");
  await expect(post).toBeHidden();
});

// An invalidated OTP request must never resurrect a signed-out account.
test("late OTP response cannot restore an edited email session",async({page})=>{
 let releaseOld;
 const oldResponse=new Promise(resolve=>{releaseOld=resolve});
 let requestStarted=false,oldUserReads=0;
 await page.route("**/forum-test-api/auth/v1/otp?*",route=>route.fulfill({json:{}}));
 await page.route("**/forum-test-api/auth/v1/verify",async route=>{
  requestStarted=true;
  await oldResponse;
  return route.fulfill({json:{access_token:"obsolete-otp"}});
 });
 await page.route("**/forum-test-api/auth/v1/user",route=>{
  if(route.request().headers().authorization==="Bearer obsolete-otp")oldUserReads++;
  return route.fulfill({json:{id:"obsolete-account"}});
 });
 try{
  await page.goto("/tr/forum/");
  const reject=page.locator("#tractorvs-analytics-reject");
  if(await reject.isVisible())await reject.click();
  const compose=page.locator("#forum-compose");
  await page.locator('.community-hero-links a[href="#forum-compose"]').click();
  await compose.locator("[data-email-choice] summary").click();
  const auth=compose.locator("[data-forum-email]");
  await auth.locator("input").fill("obsolete@example.invalid");
  await auth.locator("button").click();
  await expect(compose.locator("[data-mail-step]")).toBeVisible();
  await compose.locator("[data-code-option] summary").click();
  const verify=compose.locator("[data-forum-verify]");
  await verify.locator("input").fill("123456");
  await verify.locator("button").click();
  await expect.poll(()=>requestStarted).toBe(true);
  await compose.locator("[data-edit-email]").click();
  await expect(auth).toBeVisible();
  releaseOld();
  await expect(verify.locator("button")).toBeEnabled();
  await expect(compose.locator("[data-forum-post]")).toBeHidden();
  await expect(compose.locator("[data-forum-history]")).toBeHidden();
  expect(oldUserReads).toBe(0);
 }finally{releaseOld()}
});
