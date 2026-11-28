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
  const response=await request.get("/"+lang+"guides/farm-cost-calculator/");expect(response.status()).toBe(200);const html=await response.text();for(const id of ["farm-finance","farm-units","farm-equipment","farm-used","farm-journal","farm-ownership-plan","farm-field-plan"])expect(html).toContain('id="'+id+'"');
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

test("copy controls fail closed for uncalculated or stale results",async({page})=>{await page.goto("/tr/guides/farm-cost-calculator/");await page.locator("#tractorvs-analytics-reject").click();const add=page.locator("[data-shortlist-add]");await expect(add).toBeDisabled();const cost=page.locator("[data-copy-cost]"),form=page.locator("#farm-cost-form");await expect(cost).toBeEnabled();await form.locator('[name="area"]').fill("20");await expect(cost).toBeDisabled();await form.locator('button[type="submit"]').click();await expect(cost).toBeEnabled();const finance=page.locator('[data-decision="finance"]'),copy=finance.locator("[data-copy]");await expect(copy).toBeDisabled();await finance.locator('button[type="submit"]').click();await expect(copy).toBeEnabled();await finance.locator('[name="purchase"]').fill("100000");await expect(copy).toBeDisabled();const jumps=page.locator(".farm-tool-jump").first().locator("a");await expect(jumps).toHaveCount(10);expect(await jumps.evaluateAll(nodes=>nodes.map(a=>a.getAttribute("href")))).toEqual(["#farm-cost-form","#farm-scenarios","#farm-service","#farm-finance","#farm-ownership-plan","#farm-field-plan","#farm-units","#farm-equipment","#farm-used","#farm-journal"]);for(const href of await jumps.evaluateAll(nodes=>nodes.map(a=>a.getAttribute("href"))))await expect(page.locator(href)).toHaveCount(1);});

test("six area units, per-threshold margins and used-tractor checklist progress",async({page})=>{
 await page.goto("/tr/guides/farm-cost-calculator/");await page.locator("#tractorvs-analytics-reject").click();
 const units=page.locator('[data-decision="units"]');const choice=units.locator('[name="unit"]');
 for(const unit of ["ha","decare","acre","m2","mu","tan"])await expect(choice.locator('option[value="'+unit+'"]')).toHaveCount(1);
 await units.locator('[name="value"]').fill("15");await choice.selectOption("mu");await units.locator('button[type="submit"]').click();await expect(units.locator("[data-unit-result]")).toContainText("1 ha");
 const equipment=page.locator('[data-decision="equipment"]');await equipment.locator('[name="ptoAvailable"]').fill("20");await equipment.locator('[name="ptoRequired"]').fill("30");await equipment.locator('[name="flowAvailable"]').fill("40");await equipment.locator('[name="flowRequired"]').fill("40");await equipment.locator('button[type="submit"]').click();
 await expect(equipment.locator('[data-equipment-margin="pto"]')).toContainText("-10 kW");
 await expect(equipment.locator('[data-equipment-margin="flow"]')).toContainText("0 L/min");
 await expect(equipment.locator('[data-equipment-margin="lift"]')).toHaveText("Yetersiz bilgi");
 await equipment.locator('[name="ptoAvailable"]').fill("35");await expect(equipment.locator("[data-equipment-breakdown]")).toBeHidden();
 const inspection=page.locator("#farm-used");await expect(inspection.locator("[data-inspection-count]")).toHaveText("0 / 8");await expect(inspection.locator("[data-inspection-reset]")).toBeDisabled();
 await inspection.locator('input[type="checkbox"]').first().check();await inspection.locator('input[type="checkbox"]').nth(1).check();await expect(inspection.locator("[data-inspection-count]")).toHaveText("2 / 8");
 await inspection.locator("[data-inspection-reset]").click();await expect(inspection.locator("[data-inspection-count]")).toHaveText("0 / 8");
 await expect.poll(()=>page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth)).toBeLessThanOrEqual(2);
});

test("planning deep links open and field window reports a real shortfall, then clears stale results",async({page})=>{
 await page.goto("/tr/guides/farm-cost-calculator/#farm-field-plan");
 await page.locator("#tractorvs-analytics-reject").click();
 const details=page.locator("#farm-field-plan");
 await expect(details).toHaveJSProperty("open",true);
 const form=details.locator("form");
 await form.locator('[name="operationCount"]').selectOption("1");
 for(const [name,value] of Object.entries({dailyHours:"8",availableDays:"5","1-area":"60","1-passes":"1","1-width":"2","1-speed":"5","1-efficiency":"100","1-fuel":"4","1-price":"2","1-other":"1"}))await form.locator('[name="'+name+'"]').fill(value);
 await form.locator('[name="1-unit"]').selectOption("ha");
 await form.locator('button[type="submit"]').click();
 await expect(form.locator("[data-workdays]")).toHaveText("7,5");
 await expect(form.locator('[data-window="requiredDailyHours"]')).toHaveText("12");
 await expect(form.locator('[data-window="availableHours"]')).toHaveText("40");
 await expect(form.locator('[data-window="remainingHours"]')).toHaveText("-20");
 await expect(form.locator("[data-report-actions]")).toBeVisible();
 await form.locator('[name="availableDays"]').fill("10");
 await expect(form.locator("[data-planning-results]")).toBeHidden();
 await expect(form.locator("[data-report-actions]")).toBeHidden();
 await form.locator('button[type="submit"]').click();
 await expect(form.locator('[data-window="remainingHours"]')).toHaveText("20");
});
