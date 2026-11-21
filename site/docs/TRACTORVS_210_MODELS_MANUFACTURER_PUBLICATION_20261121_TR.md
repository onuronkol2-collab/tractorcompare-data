# TractorVS · 210 kaynaklı traktör yayını ve 10 dilde teknik doğruluk
**Tarih:** 21 Kasım 2026 | **İşlem:** canlı Supabase üretici-kaynaklı toplu yayın | **İlgili kaynaklar:** Sonalika India ve TYM International resmî model sayfaları

## Önce ve sonra
| Gösterge | Önce | Sonra | Net fark |
|---|---:|---:|---:|
| Yayımlanmış model/varyant | 200 | **210** | +10 |
| Taslak | 263 | **255** | −8 |
| Arşiv | 5 | **7** | +2 |
| RLS-kapılı kamu teknik verisi | 5.701 | **5.847** | +146 |
| Gizli, orijinal satır snapshot | — | **126** | 63 + 63 |

### Batch A — Sonalika India (10 dilde yeni 4 model, +58 açık teknik veri)
`20261121_sonalika_official_four_models_v1` · eski kayıtların 4 tractor + 59 spec toplam **63** satırı gizli `tc_backup.tractor_publication_patches` içine alındı.

| Traktör UUID | Resmî kaynak | Teknik veri | Yayın şartı |
|---|---|---:|---|
| `821bd689-5ce1-468e-a11a-66e07c7e9051` Tiger DI 30 | https://www.sonalika.com/tractor/tiger-30-gardentrac.html | 16/16 | Üretici ürün varyant tablosu **2WD**; 30 HP ölçülmüş ISO güç değil, "HP Category"; **25 HP yüksek azami PTO** ölçüm standardı belirtilmeyen ayrı bilgi |
| `8d846784-9459-47e4-b557-982a6d6feabb` RX 42 | https://www.sonalika.com/tractor/rx-42-sikander.html | **14/15** | 2WD RX 42 / Sikander family varyantları, 42 HP yalnız kategori. Üreticinin bu sayfasında bulunmayan **2891 cm³** motor hacmi `verified_at=NULL` ve **halka açık değil** |
| `596c8706-723d-4c47-befd-b0fc47bc167a` DI 35 | https://www.sonalika.com/tractor/di-35.html | 14/14 | 2WD, RX/Sikander donanım seçenekleri; temel lastik ile varyant lastik alternatifleri aynı sabit donanım gibi tanıtılmıyor; 39 HP yalnız üretici kategori bilgisi |
| `793fe40e-d19b-471f-b940-0dc39a3d2838` Tiger DI 42 PP 4WD | https://www.sonalika.com/tractor/tiger-di-42-pp-4wd.html | 14/14 | Tam 4WD model kimliği; 8F+2R; 45 HP pazarlama sınıfı; 2200 kg hidrolik kapasitesinin **ölçüm noktası kaynakta yok** |

Kaynak sayfaları **Technical Specifications** ve model-varyant fiyat tabloları ayrı okunarak kontrol edildi. `tractors.horsepower` alanlarındaki **pazarlama kategorisi** olan 30/42/39/45 değerleri, yanlışlıkla nominal motor gücü gibi görünmemesi için **NULL** yapıldı. Eski değerler orijinal snapshotlarda duruyor. Model yılı belgelenmediği için `model_year` NULL kaldı.

### Batch B — TYM international (6 model, +88 açık teknik veri)
`20261121_tym_four_families_six_models_v1` · önceki 4 tractor + 59 spec = **63** gizli snapshot.

| Yayınlanan UUID | Resmî model sayfası | Kanıtlı özellik | Kritik varyant bağlamı |
|---|---|---:|---|
| `6b8aa469-6c20-4377-9320-bd41dade4a1a` T3025 F25 | https://www.tym.world/en/products/tractors/series-3/f25 | 15 | F25 ROPS aile kaydı; SS **12F x 12R** ile HST **3-range** iki **seçenek**; 1431 kg ROPS değeri yalnız **aile** düzeyinde, her şanzımanın kesin ağırlığı değil |
| `02aa9c86-2df5-4b64-96e2-7f6a9b1df830` T4048 5025C | https://www.tym.world/en/products/tractors/series-4/5025c | 15 | Mekanik 12F x 12R; **2030 kg weight with cab**, 5025C motor hacmi **2286 cc** (5025 modelinin 2287 cc değerinden ayrıldı) |
| `cff4bd2c-cb82-43dc-aabe-dc4e4a5f910e` T4048 5025CH | aynı 5025C kaynak | 15 | 3-range HST; **2026 kg weight with cab** |
| `840269b7-e7c3-4e57-80db-56a55e9fbf46` T4058 6225C | https://tym.world/en/products/tractors/series-4/6225c | 15 | Mekanik 12F x 12R; **2030 kg weight with cab** |
| `82fbcc0b-d0b2-4fa2-940b-f8404c384840` T4058 6225CH | aynı 6225C kaynak | **14** | 3-range HST; üretici tablo verisinde 6225CH için **ayrı kabin ağırlığı verilmedi**. 2030 kg değerini buraya kopyalamadık |
| `3156002b-c2a4-428d-a63d-1853d4a89812` T5068 T68 | https://www.tym.world/en/products/tractors/series-5/t68 | 14 | **24F x 24R**, Deutz TCD2.9L4, kabin ağırlığı 2851 kg (yük/balast durumu belirtilmemiş) |

Kaynak `Engine power` değerlerinde ISO/SAE test standardı, rated/maximum ayrımı açıklanmadığı için güvenilirlik eşiği korunmuştur: veri `manufacturer_engine_power_unspecified_standard` teknik kavramında tutulur; **nominal motor gücü başlığına yerleştirilmez**. `rear_lift_capacity` değerlerinin bağlantı uçlarından mı, belirli mesafeden mi ölçüldüğü kaynaktan çıkarılamaz. Lastik seçenekleri standart tek montaj diye sunulmaz.

Önceden yayımlanmış TYM T4058 **6225 / Series 4** kaydı değişmedi. Eski karışık `5025C / Series 4` ve `6225C / Series 4` taslakları silinmeden **archived** oldu. Üreticinin belli konfigürasyonlara atadığı veriler yeni varyantlarda ayrı korundu.

## TR/EN + sekiz diğer dil için teknik etiket iyileştirmesi
Daha önce doğrulanan kayıtlardaki kritik kavramlar 10 dilde (tr,en,zh,hi,pt-br,fr,de,ru,ja,es) ayrı adlandırıldı:
- `engine_hp_category`: pazarlama kategorisi, **ölçülmüş nominal güç değil**
- `manufacturer_engine_power_unspecified_standard`: üreticinin motor gücü beyanı, **test standardı belirtilmemiş**
- `manufacturer_max_pto_power_unspecified_standard`: azami **kuyruk mili** gücü, motor gücü değil
- `manufacturer_f25_rops_weight_unscoped`: F25 ROPS ağırlığı, şanzıman varyantı belirtilmemiş
- `weight_unspecified`: yük/operasyon durumuna göre anlamı açık olmayan ağırlık
- `transmission_configuration`: şanzıman düzeni / konfigürasyon

Yalnızca **etiketler** tercüme edilir; sayı, birim, kaynak alıntısı, üretici varyantı, standard veya teknik değer değiştirilmez. Kod testleri 10 dilde mühendislik anlam ayrımını kontrol eder; otomatik testler ana dili konuşan insan editör denetiminin yerini bütünüyle tutmaz.

## Güvenlik ve dağıtım
- Her yayın öncesi kaynak URL'si, aynı model kimliği, varyant/yıl/pazar, önceki satır sayısı, kanıt, kamu görünümü, çakışan yayımlanmış kimlik, backup batch ID kontrolü yapıldı; tek atomik transaction kullanıldı. Son denetim tüm 10 yeni modelin source-linked satırlarını gördü.
- Kamu görünümü `security_invoker=true, security_barrier=true`; `anon` rolü özel `tractorvs_image_candidates` araştırma kuyruğunu okuyamaz. Hiçbir RLS/grant Auth/Edge Function değişikliği yapılmadı.
- **Supabase `published` statüsü, Astro/Cloudflare statik dosyalarının canlı olduğu anlamına gelmez.** GitHub `site/src/data/public-catalog-sync.json` bu işlem öncesi 200/5701; yayımlanan-only/anon-safe scheduled fingerprint güncellemesi, yeniden site üretimi, ardından 10 dilde HTTP/canonical/hreflang/sitemap kontrolü gerekir.
- Google Search Console görünümü, sitemap doğrulaması ve gerçek Google indeks sayısı **ayrı** kontrollerdir.
- Yeni traktör fotoğrafı eklenmedi; resmî ürün görselleri otomatik lisans izni vermez. Model/trim ve ticari kullanım hakkı ayrıca kanıtlanmalı.
- Bağımsız salt-okunur doğrulama: `supabase/verification/20261121_manufacturer_210_batch_audit.sql`; geri almada yalnız *ön kontrol*: `supabase/rollback/20261121_manufacturer_210_batch_safety_check.sql`.

## Kalan önemli açık sorun
- **255** taslak hâlâ var. Agrale 540 XT iki üretici dokümanı nesillerinin güç, hidrolik ve kabinli/kabinsiz ağırlıkları çelişkili, tek kesin kayıt gibi yayımlama.
- Sekiz dil ansiklopedi PR #127 eksik; indeks açılmaz.
- Google gerçek indeksleme, gerçek kullanıcı CrUX ve onaylı fotoğraf kapsamı ayrı denetlenmeli.
