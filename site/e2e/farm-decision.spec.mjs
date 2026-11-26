import {test,expect} from "@playwright/test";
test("localized farm tools calculate, fail closed and keep explicitly saved note local",async({page})=>{
 await page.goto("/tr/guides/farm-cost-calculator/");
 await expect(page.locator("h1")).toContainText("Traktör yakıt maliyeti");
 const fuel=page.locator("#farm-cost-form");await fuel.getByRole("button",{name:"Hesapla"}).click();
 await expect(page.locator('[data-cost-result="capacity"]')).toHaveText("1,35");
 const finance=page.locator('[data-decision="finance"]');await finance.getByRole("button").click();
 await expect(finance.locator('[data-finance-result="depreciation"]')).toHaveText("3.000");
 const equipment=page.locator('[data-decision="equipment"]');await equipment.getByRole("button").click();
 await expect(equipment.locator("[data-equipment-result]")).toHaveText("Yetersiz bilgi");
 await equipment.locator('[name="ptoAvailable"]').fill("20");await equipment.locator('[name="ptoRequired"]').fill("30");await equipment.getByRole("button").click();
 await expect(equipment.locator("[data-equipment-result]")).toHaveText("En az bir eşik karşılanmıyor");
 const journal=page.locator('[data-decision="journal"]');await journal.locator('[name="model"]').fill("Fixture tractor");await journal.locator('[name="meter"]').fill("100");await journal.locator('[name="fuel"]').fill("10");await journal.locator('[name="cost"]').fill("50");await journal.getByRole("button",{name:"Bu cihaza kaydet"}).click();
 await expect(journal.getByRole("status")).toHaveText("Bu cihaza kaydedildi");
 await page.reload();await expect(journal.locator('[name="model"]')).toHaveValue("Fixture tractor");
 await journal.getByRole("button",{name:"Kayıtlı notu sil"}).click();await expect(journal.locator('[name="model"]')).toHaveValue("");
 await expect.poll(()=>page.evaluate(()=>localStorage.getItem("tractorvs:maintenance-note:v1"))).toBeNull();
 await expect.poll(()=>page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth)).toBeLessThanOrEqual(2);
});
test("all ten public calculator routes offer matching localized decision sections",async({request})=>{
 for(const lang of ["","tr/","de/","fr/","es/","pt-br/","ru/","zh/","ja/","hi/"]){
  const response=await request.get("/"+lang+"guides/farm-cost-calculator/");expect(response.status()).toBe(200);const html=await response.text();for(const id of ["farm-finance","farm-units","farm-equipment","farm-used","farm-journal"])expect(html).toContain('id="'+id+'"');
 }
});
