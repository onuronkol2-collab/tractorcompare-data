import {test,expect} from "@playwright/test";
test("localized farm tools calculate, fail closed and keep explicitly saved note local",async({page})=>{
 await page.goto("/tr/guides/farm-cost-calculator/");
 await page.locator("#tractorvs-analytics-reject").click();
 await expect(page.locator("h1")).toContainText("Traktör yakıt maliyeti");
 const fuel=page.locator("#farm-cost-form");await fuel.getByRole("button",{name:"Hesapla"}).click();
 await expect(page.locator('[data-cost-result="capacity"]')).toHaveText("1,35");
 await fuel.locator('[name="area"]').fill("100");await fuel.locator('[name="areaUnit"]').selectOption("decare");await fuel.getByRole("button",{name:"Hesapla"}).click();await expect(page.locator('[data-cost-result="capacity"]')).toHaveText("1,35");await expect(page.locator("[data-equipment-model]")).toBeEnabled();
 const finance=page.locator('[data-decision="finance"]');await finance.getByRole("button",{name:"Hesapla",exact:true}).click();
 await expect(finance.locator('[data-finance-result="depreciation"]')).toHaveText("3.000");
 const equipment=page.locator('[data-decision="equipment"]');await equipment.getByRole("button",{name:"Hesapla",exact:true}).click();
 await expect(equipment.locator("[data-equipment-result]")).toHaveText("Yetersiz bilgi");
 await equipment.locator('[name="ptoAvailable"]').fill("20");await equipment.locator('[name="ptoRequired"]').fill("30");await equipment.getByRole("button",{name:"Hesapla",exact:true}).click();
 await expect(equipment.locator("[data-equipment-result]")).toHaveText("En az bir eşik karşılanmıyor");
 const journal=page.locator('[data-decision="journal"]');await journal.locator('[name="model"]').fill("Fixture tractor");await journal.locator('[name="meter"]').fill("100");await journal.locator('[name="fuel"]').fill("10");await journal.locator('[name="cost"]').fill("50");await journal.getByRole("button",{name:"Kayıt ekle"}).click();
 await expect(journal.getByRole("status")).toHaveText("Bu cihaza kaydedildi");
 await page.reload();await expect(journal.locator('[name="model"]')).toHaveValue("Fixture tractor");
 await expect(journal.locator('[name="fuel"]')).toHaveValue("");
 await journal.locator('[name="fuel"]').fill("5");await journal.locator('[name="cost"]').fill("10");await journal.getByRole("button",{name:"Kayıt ekle"}).click();
 await expect(page.locator('[data-history-total="count"]')).toHaveText("2");await expect(page.locator('[data-history-total="fuel"]')).toHaveText("15");await expect(page.locator('[data-history-total="cost"]')).toHaveText("60");
 page.once("dialog",dialog=>dialog.accept());await journal.getByRole("button",{name:"Tüm kayıtları sil"}).click();await expect(journal.locator('[name="model"]')).toHaveValue("");
 await expect.poll(()=>page.evaluate(()=>localStorage.getItem("tractorvs:maintenance-note:v1"))).toBeNull();
 await expect.poll(()=>page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth)).toBeLessThanOrEqual(2);
});
test("all ten public calculator routes offer matching localized decision sections",async({request})=>{
 for(const lang of ["","tr/","de/","fr/","es/","pt-br/","ru/","zh/","ja/","hi/"]){
  const response=await request.get("/"+lang+"guides/farm-cost-calculator/");expect(response.status()).toBe(200);const html=await response.text();for(const id of ["farm-finance","farm-units","farm-equipment","farm-used","farm-journal"])expect(html).toContain('id="'+id+'"');
 }
});

test("calculations count only after consent, with no values, and no history event",async({page})=>{
 await page.route("**/*",route=>["localhost","127.0.0.1"].includes(new URL(route.request().url()).hostname)?route.continue():route.abort());
 await page.goto("/tr/guides/farm-cost-calculator/");await page.locator("#tractorvs-analytics-accept").click();
 const events=()=>page.evaluate(()=>(window.dataLayer||[]).map(x=>Array.from(x)).filter(x=>x[0]==="event"));
 await page.locator("#farm-cost-form button").click();await expect.poll(events).toEqual([["event","tractor_farm_tools_view"],["event","tractor_farm_tool_calculated"]]);
 await page.locator('#farm-cost-form [name="area"]').fill("0");await page.locator("#farm-cost-form button").click();expect((await events()).length).toBe(2);
});

test("maintenance export import is validated, confirmed and local",async({page})=>{await page.goto("/tr/guides/farm-cost-calculator/");await page.locator("#tractorvs-analytics-reject").click();const input=page.locator("[data-import-history]");await expect(input).toBeEnabled();const valid={version:2,records:[{model:"Fixture",meter:10,fuel:2,cost:3}]};page.once("dialog",dialog=>dialog.accept());await input.setInputFiles({name:"history.json",mimeType:"application/json",buffer:Buffer.from(JSON.stringify(valid))});await expect(page.locator('[data-history-total="count"]')).toHaveText("1");await input.setInputFiles({name:"bad.json",mimeType:"application/json",buffer:Buffer.from("{}")});await expect(page.locator('[data-history-total="count"]')).toHaveText("1");await expect(page.locator("[data-journal-status]")).toContainText("Geçersiz");});

test("field scenario and service interval calculators use valid inputs",async({page})=>{await page.goto("/tr/guides/farm-cost-calculator/");await page.locator("#tractorvs-analytics-reject").click();await page.locator('[data-extra-form="scenario"] button').click();await expect(page.locator('[data-scenario-result="left-time"]')).not.toHaveText("—");await page.locator('[data-extra-form="service"] button').click();await expect(page.locator('[data-service-result="remaining"]')).toHaveText("200");await expect(page.locator('[data-service-result="next"]')).toHaveText("350");});
