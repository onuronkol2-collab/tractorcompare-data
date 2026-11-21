# TractorVS — Swaraj 843 XT: üretici kaynaklı 2WD / 4WD ayrı yayın
**21 Kasım 2026 · Gerçek Supabase transaction sonucu · Hindistan pazarı**

## Gerçekleştirilen işlem
- Canlı işlem öncesi: 462 traktör = 191 published / 269 draft / 2 archived; public view 5.512 güvenlik-kapılı teknik satır.
- **Swaraj 843 XT 2WD** (published UUID `d22fd896-b550-41f6-9686-d6f927e53ebc`), **24 doğrulanmış özellik**.
- **Swaraj 843 XT 4WD** (published UUID `d109cb8d-9797-4852-ad3b-5713e8f9f790`), **24 doğrulanmış özellik**.
- Önceki belirsiz birleşik 843 XT taslağı **archived** yapıldı; silinmedi. Kaynak satırlarının asılları korundu.
- Tek transaction'da **48 yeni teknik kayıt** eklendi ve kaynak URL, `evidence_text`, `verified_at` kontrollerinden geçti.
- Yayın sonrası: **464 toplam = 193 published / 268 draft / 3 archived**, yeni 48/48 satır `tractorvs_public_specs` görünümünde doğrulandı. 27 önceki kayıt `tc_backup.tractor_publication_patches` içinde `20261121_swaraj_843xt_variants_v1` batch koduyla yedeklendi.

## Birincil kaynak ve teknik koşullar
Üretici modeli ve 2WD/4WD koşulları: https://www.swarajtractors.com/swaraj-843-xt-tractor

Üreticinin aynı sayfasındaki **Engine / Transmission / PTO and Hydraulics / Tyre Size / Dimensions** tabloları konfigürasyon başlıklarına göre ayrı ayrı karşılaştırıldı:
- Her ikisi: üç silindir, 2.734 cm³, 2.100 r/min, 1.800 kg üretici tarafından belirtilen hidrolik kapasite (**ölçüm noktası açıklanmıyor**), 56 L depo.
- 2WD: 2.035 mm dingil mesafesi, 3.455 mm uzunluk, 1.785 mm genişlik, 2.240 mm yükseklik; üretici ölçülerinde 13.6x28 arka / 6.00x16 ön lastik koşulu.
- 4WD: 2.170 mm dingil mesafesi, 3.570 mm uzunluk, 1.800 mm genişlik, 2.280 mm yükseklik; üretici ölçülerinde 13.6x28 arka / 8.30x20 ön lastik koşulu.
- 2WD/4WD şanzıman, direksiyon, debriyaj, lastik ve PTO farkları kayda **ayrı** yazıldı; opsiyonlar standart donanım gibi sunulmadı.
- Üretici **45 HP / 33.09 kW güç sınıfını** veriyor ancak bir nominal test standardı açıklamıyor; bu güç sınıfı `tractors.horsepower` alanına, kesin motor gücü olarak **yazılmadı**. `model_year` de kanıtsız belirlenmedi.

## Koruma / geri alma
- Kaynak/yıl/varyant, RLS, anon grants, secret keys, forum ve eski published satırlar değiştirilmedi.
- Eski ana kaydın ve 26 teknik satırının 27 satırlık yedeği özel `tc_backup` alanında.
- Canlı kaynak ve fotoğraf adayları özel olarak kalır; doğrulanmamış fotoğraf yayımlanmaz.
- `supabase/verification/20261121_swaraj_843xt_variant_publish_audit.sql` salt okunur canlı sonrası denetimdir.
- `supabase/rollback/20261121_swaraj_843xt_variants_reviewed_rollback.sql` yalnız **açık regresyon halinde ve manuel** değerlendirmeyle kullanılabilecek korumalı geri almadır; otomatik koşturulmaz.

## Araştırmada bloke edilen diğer taslaklar
- Swaraj **735 XT 4WD**: üreticinin 4WD ürün sayfası tanıtım kısmında 4WD/1.700 kg derken teknik detay tablosunda **2WD / 1.650 kg** gösteriyor. 2WD sayfası içerik taşması ve varyant karışması olasılığı nedeniyle 4WD taslağı otomatik doğrulanmadı.
- Swaraj **843 XM**: 2019 tarihli üretici broşürü ve güncel sayfa hidrolik/ölçülerde farklı sürüm değerleri taşıyor; tek model-yıl gibi birleştirilmedi.

## Dağıtım / SEO
Bu kayıt işlemi sadece **Supabase canlı veritabanını** değiştirir. Statik Astro sayfalar, SEO sitemap ve Cloudflare için yayımlanmış katalog parmak izi senkronu ve yeni production build gerekir; **CI başarılı olması canlı deploy veya Google indeks garantisi değildir**. 10 dilde URL/canonical/hreflang ve sayfa kaynak bağlantıları üretim dağıtımından sonra ayrıca denetlenmelidir.
