# TAFE 6515 4WD — dört resmî teknik bilginin kaynaklı doğrulama kaydı

**Tarih:** 23 Kasım 2026  
**Model:** `01b0b5ac-22a9-4167-9b81-7f2b908830a3`, **TAFE 6515 4WD**, Türkiye pazarı.  
**Doğrudan üretici kaynağı:** https://tafetractors.com/en-tr/products/tafe-6515-4wd  
**Kaynak sınıfı:** `manufacturer_specification`. Model, pazar ve şanzıman bilgileri üretici sayfasında açıkça belirtiliyor.

| Alan | Değer | Resmî ürün sayfası kanıtı |
|---|---|---|
| `engine_emission_standard` | EU Stage V | “engine complies with the Euro Stage V standards” |
| `forward_gears` | 12 | “12 F + 12 R” ve “12 forward and 12 reverse” |
| `reverse_gears` | 12 | Aynı üretici modelinin 12 geri vitesi |
| `transmission_gear_configuration` | 12F + 12R | TAFE 6515 4WD teknik özellik tablosu |

**Bilinçli olarak onaylanmayan:** `transmission_type='Synchromesh mechanical shuttle'`. Resmî ürün sayfasında açıkça “Synchromesh transmission” bilgisi var, ancak mevcut birleşik ifadenin “mechanical shuttle” alt türü bu sayfanın açık teknik metninden tam doğrulanamadı. Birbirine bağlı şanzıman terimlerini tahminen doldurmak yerine yalnız dört kesin bilgiyi yayımladık.

**Üretim uygulaması:** `public.tractor_specs` içinde tam **4/4** model UUID + kaynak ID `3bf8cb36-cccf-4bf3-af53-530853903465` + doğru üretici URL'si + alan anahtarı/değeri ve önceki `verified_at,last_verified_at=NULL` şartları atomik SQL işleminin ön koşulu. Bu eşleşmeler başarıyla doğrulandı; gerçek `verified_at,last_verified_at` zamanları ile alan bazında `evidence_text` eklendi. Değer, birim, model, kaynak kimliği, fotoğraf, RLS, şanzıman varyantı, fiyat ve URL **değişmedi**. SQL commit sonrası dört alan da tarihli olarak tekrar doğrulandı. Modelin 4WD kimliği ve 65 HP fabrika beyanı başka ürün sayfalarına taşınmadı.

**Statik yayın kontrolü:** DB güncellemesinden sonra `https://tractorvs.com/tr/tractors/tafe-6515-01b0b5ac/` üretim HTML'sinde önceki **10** üretici kaynaklı özellik görüntülendi; yeni dört alan henüz görünmüyordu. Bu **belge PR'ı**, güvenli GitHub main merge/Cloudflare üretim derlemesi üzerinden kaynak onaylı dört alanın canlı sitede görünmesi için hazırlandı. Merge oldu diye canlı yayımlandığını iddia etmeyin: sonrasında TR/EN sayfalarında HTTP200/canonical/robots ve resmî TAFE kaynak URL'sinin altında 14 kaynaklı teknik alanı ayrıca gözle doğrulayın. Olası diğer concurrent yayınlı değişikliklerde toplam artabilir; sadece doğru alan kimliklerini kontrol edin.

**Kaynak bütünlüğü:** Bu işlem SEO/H1, 10 dil, resmî ve bağımsız kaynak sınıfı, RLS, görüntü lisansları, AnalyticsConsent, fiyat ve diğer TractorVS modüllerini değiştirmez. Model yılı veya engine power standartları uydurulmadı.

**Takip:** Genel model QA issue [#192](https://github.com/onuronkol2-collab/tractorcompare-data/issues/192).