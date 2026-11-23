# TractorVS — Antonio Carraro 10 modelde 47 resmî kaynak doğrulaması

**Tarih:** 23 Kasım 2026. **Veri:** TractorVS Supabase üretim `aaufxtcvnzgavtlintiv`. **Yöntem:** Üreticinin her modelin gerçek, açık ürün sayfası birebir okunup model kimliği, pazar, kapasite/şanzıman ve motor ayrımlarıyla tam satır karşılaştırması.

## Resmî kaynak listesi ve işlem miktarı

| Avrupa Stage V model | Model UUID | Bağımsız OEM sayfası | Bu tur doğrulanan |
|---|---|---|---:|
| TONY 8900 TRG | `7fa6422c-6cfc-401e-8677-6933fbe8ea62` | https://www.antoniocarraro.it/en/catalogue/TRG_TONY | 7 |
| MACH 4 R | `f267b552-5cdb-4936-9857-b4d88f0618cb` | https://www.antoniocarraro.it/en/catalogue/mach-4-r | 6 |
| TGF 7800 S | `44929c2c-c1db-48e8-a8a5-fdfef3bb467f` | https://www.antoniocarraro.it/en/catalogue/tgf | 5 |
| TONY 8700 V | `057ddf74-0aac-48d0-a2ca-44df28e48619` | https://www.antoniocarraro.it/en/catalogue/TONY_8700V | 4 |
| TRX 5800 | `cf9f7eff-7d64-4c5a-83d3-281e37679252` | https://www.antoniocarraro.it/en/catalogue/TRX_5800 | 5 |
| TRX 7800 S | `b678b91d-976c-489a-9d75-ce85865f91ad` | https://www.antoniocarraro.it/en/catalogue/trx | 5 |
| Panther 26 H | `48e8caec-9a7f-4eb6-b271-9a7c517c7d27` | https://www.antoniocarraro.it/en/catalogue/Panther_26H | 4 |
| Panther 26 M | `da7afde6-6c29-49b9-a79f-63bc32025825` | https://www.antoniocarraro.it/en/catalogue/Panther_26M | 4 |
| SN 6800 V | `321df789-607c-4045-b5d7-9a428e5d117f` | https://www.antoniocarraro.it/en/catalogue/SN_6800V | 4 |
| TC 6800 F | `ef4320ef-6d0c-41fd-b35a-1e74377d76e8` | https://www.antoniocarraro.it/en/catalogue/TC_6800_F | 3 |
| **Toplam** | **10 benzersiz model** | **10 tam model sayfası** | **47** |

Bu 47 satırın her biri `public.tractor_specs` içinde **`tractor_id`, `public.tractors.model_name`, `canonical_key`, `spec_value`, eski resmî `source_id`, `public.data_sources.source_url` ve `source_type='manufacturer'`** eşleşmesiyle **`verified_at IS NULL AND last_verified_at IS NULL`** şartında ayrı bir üretici kaynak QA'sından geçti.

- TONY 8900 TRG: 7/7 model sayfası kaydı; kaynakla doğrulanan `54.6 kW / 74.2 hp @ 2400 rpm`, KUBOTA 3.769 cm³ Stage V, dört SIM robotik kademe, ROPS `2290–2400 kg` / Air cab `2470–2580 kg`.
- Dokuz farklı model: 40/40 eşleşen kaynak kaydı tek SQL transaction ile doğrulandı; **40/40 doğrulanmadan commit etmeyen fail-closed kontrol** kullanıldı. Doğrulamalar kullanıcıya yayın veya veri üzerinde yanlış değer değiştirme gerekçesi yapılmadı; yalnız `verified_at`, `last_verified_at` ve mevcut `evidence_text` alanlarına spesifik kaynak açıklaması kaydedildi.
- **Değiştirilmeyenler:** Tüm `spec_value`, `unit`, `canonical_key`, `source_id`, `source_priority`, şanzıman/varyant/model kimliği, model yılları, kategori, fotoğraf lisansları, SEO slug/canonical/hreflang, güvenlik/RLS ve fiyat.

## Bilinçli QA dışı bırakılan alanlar

Üreticinin genel **`Capacity (KG)`** ifadesi, ölçüm noktası / arka üç nokta bağlantısı netleşmedikçe `rear_lift_capacity` olarak kesinleştirilmedi: TONY 8900 TRG 2400; MACH 4 R mevcut kapasite; TGF 7800 S 2300; TONY 8700 V 2700; TRX 5800 2190; TRX 7800 S 2150; Panther 26 H 900; Panther 26 M 850; SN 6800 V 2190; TC 6800 F 2190. Bunların değerleri **yanlış kanıtlanmış değildir**; ancak teknik anlamı resmî sayfadan bağımsız kesinleştirilemediği için doğrulama bayrağı verilmedi. Ek olarak, TONY 8700 V için kaynakta bulunmayan **375 Nm** tork; TC 6800 F için doğrudan kaynakta açık olmayan **2091cc** motor hacmi de onaylanmadı.

Dikkat: ROPS, RedCab, Air cab, Protector cab ve standart kabin ağırlık aralıkları **tek bir genel traktör çalışma ağırlığı olarak birleştirilmedi**. Motor gücü HP / kW, PTO/devir ve farklı Stage V varyantların model kimlikleri korunmuştur.

## Üretim doğrulama ve yayın kapısı

Anonim `SET LOCAL ROLE anon` altında `public.tractorvs_public_specs` görünümüyle SQL test edildi. Bu 10 modelin **tamamında doğrulama tarihi olan yayınlanabilir satırlar** görünür durumda; `10/10` modelin üretici URL'si `antoniocarraro.it` olarak bağlantılı. Bazı modellerde **1–2 tarih verilmeyen özellik**, bu kayıtlar için kaynak/ölçüm koşulu belirsiz olduğu için, güvenlikten taviz vermeden hâlâ withheld.

**İlk Cloudflare canlı baz ölçümü (bu belge yayınlanmadan):**
- EN TONY 8900 TRG: **15** teknik satır ve üretici linki;
- TR MACH 4 R: **16** teknik satır ve üretici linki;
- EN Panther 26 H: **10** teknik satır ve üretici linki.

Kaynak QA sonrası bu modellerin güvenli kamu görünümü sırasıyla **22, 22 ve 14** doğrulanmış teknik satır gösteriyor. Canlı Astro sayfalarının bu sayılara gelmesi için **normal Cloudflare statik rebuild** gerekir; doküman içeren bu PR, güvenli üretim yeniden derlemesini tetiklemek üzere açılmıştır. *GitHub main'e merge edilmiş olmak, canlı yayın kanıtı değildir.*

**Merge öncesi:** GitHub Altın Kural, site Node/Astro build, üretim Worker güvenlik ve ilgili PR testleri başarılı olmalı. Test/yapı tespitlerinde kırmızı varsa merge etmeyin. Başka ajanların i18n, frontend, fotoğraf ve güvenlik PR'larını değiştirmeyin.

**Merge sonrası:** EN/TR/diğer locale model URL'leri HTTP 200, canonical/hreflang/indexable, gerçek model varyantı ve kaynak etiketleri, tüm manufacturer links onaylı https host, 20+ yayımlı alan ve kaynak sayısı canlıdan tekrar ayrı doğrulanmalı. Google indekslemesi otomatik garanti değildir.

**İlgili açık konular:** [#192 kaynaklı model denetimi](https://github.com/onuronkol2-collab/tractorcompare-data/issues/192), [#490 Agrale 6185 çelişkisi](https://github.com/onuronkol2-collab/tractorcompare-data/issues/490), [#393 Başak 2075 BK uzunluk ölçümü](https://github.com/onuronkol2-collab/tractorcompare-data/issues/393). Kullanıcının SEO/GEO/özgünlük önceliğine sadık kalındı; kaynak dışı teknik sayı veya sahte doğrulama uydurulmadı.
