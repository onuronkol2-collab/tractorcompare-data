# TractorVS — Mahindra üretici kaynaklı dokuz model yayını (21 Kasım 2026)

## Gerçek üretim kontrol noktası
| Gösterge | Önce | Sonra |
|---|---:|---:|
| Published traktör/varyant | 221 | **230** |
| Draft | 247 | **238** |
| Archived | 10 | **10** |
| Anon-güvenli kaynaklı teknik satır | 5.997 | **6.113** |
| Yeni kaynak doğrulanmış özellik | — | **116** |
| Gizli özgün satır yedeği | — | **130** (45 + 85) |

Bunlar *Supabase* gerçek üretim verileri ve işlem sonrası bağımsız SELECT kontrolleridir; yeni statik Astro/Cloudflare sayfalarının dağıtımı için aşağıdaki güvenli katalog senkronizasyonu ve ayrı canlı SEO taraması gerekir. Google Search Console sitemap submitted = gerçek indekslenmiş sayı değildir.

## Mahindra OJA — üç ayrı Hindistan 4WD modeli

Üretici **bireysel model teknik sayfaları** ve aynı serinin resmî İngilizce/Hindice broşürleri birbirleriyle karşılaştırılmıştır. Kaynaklar:
- [OJA 3132](https://www.mahindratractor.com/tractors/mahindra-oja-3132-tractor)
- [OJA 3136](https://www.mahindratractor.com/tractors/mahindra-oja-3136-tractor)
- [OJA 3140](https://www.mahindratractor.com/tractors/mahindra-oja-3140-tractor)
- [Mahindra OJA Utility Hindi brochure](https://www.mahindratractor.com/sites/default/files/leaflet/Hindi%2059.4%28W%29X21%28H%29_CM_OJA_SU_BROCHURE_R2_CC%204%20pager_%28Hindi%29%204-5-24.pdf)

| Mevcut traktör ID | Kimlik | Kaynaklı teknik satır | Ek not |
|---|---|---:|---|
| `adfcfeb9-0604-4f77-bf30-2e0607404743` | OJA 3132, India 4WD, 8F×8R | **13** | Önceden hatalı **102 Nm**, model teknik sayfası ve üretici broşürüne uygun **107,5 Nm** yapıldı |
| `413bd1b9-969b-44ab-92cf-503683935776` | OJA 3136, India 4WD, 12F×12R | **12** | Model sayfası arka lastik **12.4×24**, başka resmî broşür **12.2×24**: alan `verified_at=NULL`, kamuya çıkmadı |
| `52acafb7-b66d-4d88-be34-5c6091b0f2b0` | OJA 3140, India 4WD, 12F×12R | **13** | Üreticiye göre azami tork **133 Nm** |

Üç modelde tam model kaynağı **Single clutch** yazdığı için, eski `Single / Dual` genel varyant tahmini **Single** olarak kaynaklı düzeltildi. Başka bir Mahindra dokümanı `540/540E`, model sayfası `540/750` söylüyor: farklı PTO çalışma biçimleri aynı şey kabul edilmedi; üç `pto_speeds` satırı **kanıt çelişkisiyle karantinada**. Model sayfalarındaki 21–35 / 36–50 **seri HP aralıkları** tam modelin test edilmiş motor gücü diye yayımlanmadı. Bunun yerine üreticiye göre modele özgü `23.9 / 26.8 / 29.5 kW` `manufacturer_engine_power_unspecified_standard` etiketinde tutuldu: **ISO/SAE, rated/max ve PTO testi belirtilmemiştir; `tractors.horsepower=NULL`**.

**Özellikle yayımlanmadı:** OJA **2121** modelinin üretici sayfası başlığı *2WD*, aynı sayfanın teknik tablosu *4WD* diye geçiyor. Varyantı kesinleşmeden taslak kalır. Resmî PDF metni karşılaştırıldı; web PDF screenshot servisi cache miss döndürdüğünden sayfa görseli ayrıca okunamadı.

Transaction `20261121_mahindra_oja3132_3136_3140_india_v1`: **3 eski tractor + 42 spec = 45** özel JSONB original snapshot.

## Mahindra JIVO / YUVRAJ — altı kaynak eşleşmeli ayrı konfigürasyon

Kaynaklar yalnız bireysel resmî model teknik tablolarıdır:
- [JIVO 225 DI 2WD](https://www.mahindratractor.com/tractors/jivo-225-di)
- [JIVO 225 DI 4WD](https://www.mahindratractor.com/tractors/jivo-225-di-4wd)
- [JIVO 225 DI 4WD NT](https://www.mahindratractor.com/tractors/mahindra-jivo-225-di-4wd-nt)
- [JIVO 245 Vineyard 4WD](https://www.mahindratractor.com/tractors/mahindra-jivo-245-vineyard)
- [YUVRAJ 215 NXT 2WD](https://www.mahindratractor.com/tractors/yuvraj-215-nxt)
- [YUVRAJ 215 NXT NT 2WD](https://www.mahindratractor.com/tractors/mahindra-yuvraj-215-nxt-nt-tractor)

| Traktör ID | Model ve varyant | Kaynaklı özellik |
|---|---|---:|
| `d52fdf40-1666-4880-a24b-61317308e5f1` | JIVO 225 DI, India **2WD**, 8F×4R | 13 |
| `34f40738-a78d-4223-b52d-d0bfaa9903f2` | JIVO 225 DI, India **4WD**, 8F×4R | 13 |
| `c67f6152-7377-4c22-b6f2-166c58e87f0c` | JIVO 225 DI **4WD NT dar izli**, 8F×4R | 13 |
| `846dd47d-cf3d-4e12-8957-265b6d16931b` | JIVO 245 Vineyard **4WD** | 13 |
| `8f4b2005-ec80-44a9-a093-fd2a3e9d8bc8` | YUVRAJ 215 NXT, **2WD**, 6F×3R | 13 |
| `ebe20072-90ee-41ac-a004-6ef3906c7533` | YUVRAJ 215 NXT **NT**, **2WD**, 6F×3R | 13 |

**Hatalı taslak düzeltmeleri:** JIVO 245 Vineyard eski azami tork `85 Nm` → üreticiye göre `81 Nm`; YUVRAJ 215 NXT eski kaldırma `750 kg` → `778 kg`. JIVO 225 DI ve 245 Vineyard resmi ürün sayfalarının `PTO RPM 540/750` alanı korunarak eski hatalı `540, 540E` genel çıkarımı tam modele uygun düzeltildi. 4WD NT için kaynakta bulunan ama kayıtta eksik olan PTO `540/750` ayrıca oluşturuldu. JIVO 225 2WD/4WD/4WD NT ve YUVRAJ 215 NXT için resmî tabloda geçen ve eksik olan azami tork `66.5 Nm` / `48 Nm` kanıtlı olarak eklendi.

Bazı 4WD ürün sayfalarının FAQ metninde kopyalanmış *2WD* pazarlama ifadeleri var; **resmî model başlığı, model kimliği ve teknik tablosu 4WD'de uyuştuğu için**, yanlış FAQ yerine bunlar esas alındı. 2WD/4WD/NT/bağ ve şanzıman özellikleri ayrı kaydedildi. Her 6 modelin `up to 20 HP` / `21–35 HP` gibi kapsamı geniş liste etiketleri doğrulanmış modelin tam test motor gücü olarak gösterilmedi; `horsepower` boş bırakıldı.

Transaction `20261121_mahindra_jivo_yuvraj_six_models_v1`: **6 eski tractor + 79 spec = 85** özel JSONB original snapshot. Yayındaki **78** yeni kaynaklı teknik satırın tümü denetlendi.

## Güvenli yayın işlemleri ve kalan iş
- İki batch'lik üretim SQL'i, önceden marka/model/variant/market/year/source URL/kanit/satır sayısı ve yayımlanmış duplicate kontrolü yapılarak **tek işlem içinde** uygulandı. Hata durumunda hiçbir kısmi değişiklik bırakmamak için guard/exception kullanıldı.
- `tc_backup.tractor_publication_patches` içinde **130 özgün kaynak satırı** korunuyor. Geri almada *yeni 3+5 tekn. satırı*, fonksiyon/RLS, forum, kullanıcı linkleri ve SEO URL bağımlılıkları ayrı değerlendirilmeden toplu DELETE yapılmamalı.
- Kamu `tractorvs_public_specs` görünümü `security_invoker=true, security_barrier=true`; `anon` özel `tractorvs_image_candidates` SELECT yapamıyor. Fotoğraf yetkisi ve lisansı olmadan yeni görüntü kaydı yok.
- **Sonraki adım:** GitHub yalnız anon public view parmak izi yeni `230/6113` durumuna getirmeli, Git-connected Cloudflare yeniden build sonrası 10 locale canonical/hreflang/sitemap HTTP gerçek URL taraması yapılmalı. Google indekslenme raporu için GSC Page Indexing/URL Inspection gerekir, sitemap URL sayısı yetmez.
- **Açık:** kalan 238 taslak, diğer Mahindra OJA 2121 çekiş çelişkisi, JIVO/OJA eski belge sürümleri, Agrale 540 XT belge sürümleri, lisanslı model/varyant görselleri, çok dilli ansiklopedi taslağı PR #127 ve gerçek forum üyelerinin katkıları.

Bu yayının bağımsız salt-okunur doğrulama SQL'i: `supabase/verification/20261121_mahindra_230_publication_audit.sql`.
