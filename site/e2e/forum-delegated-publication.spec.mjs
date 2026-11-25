import {test,expect} from "@playwright/test";
test("delegated topic permission is explicit, revocable and isolated between sessions",async({page})=>{
 let owner="owner-a", grants=new Map(), writes=[];
 await page.route("**/forum-test-api/**",async route=>{
  const req=route.request(),url=new URL(req.url());
  if(url.pathname.endsWith("/auth/v1/user"))return route.fulfill({json:{id:owner}});
  if(url.pathname.endsWith("/auth/v1/settings"))return route.fulfill({json:{external:{google:false,github:false}}});
  if(url.pathname.endsWith("/auth/v1/logout"))return route.fulfill({status:204});
  if(url.pathname.endsWith("/rest/v1/tc_forum_assisted_eligible"))return route.fulfill({json:owner==="owner-a"?[{owner_id:owner}]:[]});
  if(url.pathname.endsWith("/rest/v1/tc_forum_assisted_grants")){
   if(req.method()==="GET")return route.fulfill({json:grants.has(owner)?[grants.get(owner)]:[]});
   expect(req.headers().authorization).toBe("Bearer test-only");
   writes.push({method:req.method(),body:req.postDataJSON(),owner});
   if(req.method()==="POST"){
    expect(req.postDataJSON()).toEqual({owner_id:owner});
    grants.set(owner,{id:"fixture-grant",expires_at:new Date(Date.now()+86400000).toISOString(),revoked:false});
   }else if(req.method()==="PATCH"){
    expect(url.searchParams.get("id")).toBe("eq.fixture-grant");
    expect(req.postDataJSON()).toEqual({revoked:true});
    grants.delete(owner);
   }
   return route.fulfill({status:204});
  }
  return route.fulfill({json:[]});
 });
 await page.goto("/tr/forum/");
 const reject=page.locator("#tractorvs-analytics-reject");
 if(await reject.isVisible())await reject.click();
 const panel=page.locator("[data-delegated-panel]");
 const approve=panel.locator("[data-delegated-confirm]");
 const activate=panel.locator("[data-delegated-activate]");
 const revoke=panel.locator("[data-delegated-revoke]");
 const status=panel.locator("[data-delegated-status]");
 await expect(panel).toBeHidden();
 await page.goto("/tr/forum/?delegate-test=1#access_token=test-only");
 await expect(panel).toBeVisible();
 await panel.locator("summary").click();
 await expect(status).toHaveText("Yetki yok");
 await expect(activate).toBeDisabled();
 await expect(revoke).toBeDisabled();
 expect(writes).toHaveLength(0);
 await approve.check();
 await expect(activate).toBeEnabled();
 await activate.click();
 await expect(status).toContainText("Bitiş zamanı");
 expect(writes).toHaveLength(1);
 await expect(activate).toBeDisabled();
 await revoke.click();
 await expect(status).toHaveText("Yetki yok");
 expect(writes).toHaveLength(2);
 await expect(approve).not.toBeChecked();
 await expect(activate).toBeDisabled();
 await approve.check();
 await activate.click();
 await expect(status).toContainText("Bitiş zamanı");
 await page.locator("[data-forum-logout]").click();
 await expect(panel).toBeHidden();
 owner="owner-b";
 await page.goto("/tr/forum/?delegate-test=2#access_token=test-only");
 await expect(panel).toBeHidden();
 await expect(approve).not.toBeChecked();
 await expect(activate).toBeDisabled();
 expect(writes).toHaveLength(3);
});
