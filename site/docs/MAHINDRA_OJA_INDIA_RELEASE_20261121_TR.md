# TractorVS — Üç Mahindra OJA 4WD modelinin doğrulanmış yayını
**Tarih:** 21 Kasım 2026 · **Parti:** `oja-india-20261121`

## Gerçek veritabanı sonuçları
- Önce: 172 published / 288 draft / 2 archived
- Sonra: **175 published / 285 draft / 2 archived**
- Yayımlanan modeller: Mahindra OJA 2124, OJA 2127 ve OJA 2130 — **India / 4WD (India)**.
- Her modelde 15 dahili teknik satırın **14 tanesi** kaynak URL + kanıt metni + verified_at ile doğrulandı; model ailesi genel `21–35 HP` aralığı **model motor gücü diye yayımlanmadı** (horsepower NULL).
- Üreticinin resmî ürün sayfaları: 
  - https://www.mahindratractor.com/tractors/mahindra-oja-2124-tractor
  - https://www.mahindratractor.com/tractors/mahindra-oja-2127-tractor
  - https://www.mahindratractor.com/tractors/mahindra-oja-2130-tractor
- Model sayfalarına göre dizel motor silindir sayısı 3, 4WD, India; PTO devri **540/780 rpm**; transmisyon **Constant mesh with synchro shuttle, 12 ileri + 12 geri**; hidrolik kaldırma 950 kg; üretici değerlerinin ölçüm koşulları korunur.
- Düzeltmeler: eski taslaklardaki `540, 540E` yerine üreticinin bu model için verdiği `540/780`; varyantları karıştıran `8F+4R / 12F+12R` gibi genel seçenekler yerine model bazındaki `12 F + 12 R`; debriyaj için *Single*; diğer belgeli teknik alanların tam kaynak atfı.
- Mahindra **OJA 2121 yayımlanmadı**: üretici URL başlığında 2WD, teknik özelliğinde 4WD belirtiliyor; kesin varyant kaydı için ek doğrulama gerekir.
- Ayrı seri/nesil karışımı nedeniyle Deutz-Fahr 5090 D taslakta kaldı.

## İndeksleme güvenliği
`tractor_specs` anonim okuma politikası ve `tractorvs_public_specs` security_invoker view'ı artık yalnızca şu üçlüye sahip satırları gösteriyor: **verified_at, dolu evidence_text, source_id**. Tam olmayan eski 2 özellik gizlendi, silinmedi. Bağımsız `SET LOCAL ROLE anon` sorgusunda **175 ayrı model, 5.313 kaynaklı teknik kayıt, 0 kanıtsız özellik** doğrulandı. View `security_barrier=true` ayarı korunuyor.

## Geri alma
`tc_backup.tractor_publication_patches` tablosu, `oja-india-20261121` parti kimliğinde **3 traktör + 45 teknik kayıt** orijinal JSONB satırını saklar. Eski statüler veya ölçümler gerektiğinde bu kayıtlar üzerinden kontrollü ve tekil geri alma yapılabilir; başkaca modele dokunulmaz. Tabloya anon/authenticated erişimi verilmedi.

## Dağıtım doğrulama sırası
1. GitHub PR testleri, anonim üretim verisiyle gerçek production build, Cloudflare deploy.
2. `site/src/data/public-catalog-sync.json` yalnız anon view senkronuyla güncellenmeli; kimlik/fingerprint uydurulmamalı.
3. Üretim URL, canonical, hreflang, sitemap, kaynak linkleri ve mobil sayfa çıktısı ayrı kontrol edilmeli.
4. Google Search Console dizine eklenme durumunu gecikmeli olarak izleyin; DB statüsü veya başarılı dağıtım Google indeks garantisi değildir.
