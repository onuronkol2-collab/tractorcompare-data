# TractorVS — Agrale 7215 üretici kanıtına geçiş ve canlı yayın kontrol kaydı

**Tarih:** 23 Kasım 2026  
**Proje:** `aaufxtcvnzgavtlintiv` (Supabase üretim)  
**Model kaydı:** `5d2edc98-24ce-4d19-a1c7-e51aa0b96414`  
**Model kimliği:** Agrale 7215, **Brezilya**, MWM Maxx Force 6.0A, **220 cv**, senkronize manuel **12F/4R**. Arjantin pazarındaki Perkins 205,2 cv varyantıyla birleştirilmez.

## Kaynaklar

1. **Üretici asıl kaynak, İngilizce teknik broşür:** https://www.agrale.com.br/en/pdf/gerar/249/tractors-agricultural-tractors-tractor-7215-1
2. **Üretici asıl kaynak, Portekizce teknik broşür:** https://www.agrale.com.br/pdf/pt/tratores_6000_trator_agrale_7215_1.pdf?date=1520009159
3. **Üreticinin canlı model tanımı:** https://www.agrale.com.br/pt/detalhes/tratores/tratores-agricolas/trator-7215
4. **İkincil destek, eski satırların orijinal kaynağı:** https://www.popagro.com.br/catalogo/maquinas-agricolas/tratores/agrale/7215

Resmî broşürlerin metin verileri model/donanım ve her alan anlamıyla karşılaştırıldı; web PDF ekran görüntüsü servisi önbellek hatası verdiğinden görsel çıktı üzerinden *tam sayfa görsel kontrolü yapıldığı iddia edilmiyor*. Üretici web sayfası model kimliği ve motoru doğrudan doğruluyor; kaynak teyidi bu belirli **Brazil/MWM/220cv** varyantına özgüdür.

## Üretimde bağımsız doğrulanan ve kaynakları güncellenen alanlar

| `canonical_key` | Kaynaktaki anlam | Doğrulanmış değer |
|---|---|---|
| `diff_lock` | Electro-hydraulic differential lock actuation | Electrohydraulic engagement |
| `engine_rated_speed` | Rated engine rpm at 220 cv | 2300 rpm |
| `front_axle_type` | 4WD limited-slip central differential | Self-locking center differential |
| `front_tire_size` | Standard front tires | 18.4-26 R1 |
| `fuel_tank_capacity` | Fuel tank | 460 L |
| `hydraulic_flow` | Hydraulic maximum flow, at 2000 engine rpm | 192 L/min |
| `pto_engine_rpm_1000` | Engine rpm for 1000 PTO rpm | 2077 rpm |
| `pto_engine_rpm_540` | Engine rpm for 540 PTO rpm | 2033 rpm |
| `pto_speeds` | PTO output speed options | 540 / 1000 rpm |
| `pto_type` | PTO independence | Independent |
| `rear_tire_size` | Standard rear tires | 30.5L-32 R1 |
| `shipping_weight` | **Shipping weight**, not curb weight | **8430 kg** |
| `transmission_gear_configuration` | Forward/reverse gears | 12F+4R |

**Kritik anlam ayrımı:** Broşürdeki `8.430 kg` sevkiyat ağırlığıdır; `11.000 kg` çalışma ağırlığıyla aynı alan değildir. `2033/2077 rpm` motor devridir; PTO çıkış devri `540/1000 rpm` değerlerinden ayrıdır. Hidrolik `192 L/min` değeri üreticinin **2000 motor rpm** koşulunda verilir. Kaynak kimliği herhangi bir yıl ya da farklı ülke motorunun otomatik teyidi değildir.

## Uygulanan atomik Supabase işlemi

- `tractor_specs` içinde tam **13/13** eski `verified_at=NULL, last_verified_at=NULL`, `source_id=PopAgro` satırı hem `canonical_key` hem **tam `spec_value`** ile eşleşmeden güncelleme yapılmadı.
- Yeni `data_sources` kaydı `official_technical_pdf`, `source_priority=95` ile eklendi; 13 kayıt `source_id`, `source_priority`, `verified_at`, `last_verified_at`, `evidence_text` alanlarında yalnız doğrulanmış resmî kanıta yönlendirildi.
- Değer/birim, mevcut model UUID ve slug, durum, pazar/varyant, özel içerik RLS ve fotoğraf lisansları **değişmedi**.
- Transaction commit öncesi **13/13 satırın güncellenmesi** şartına bağlandı; sonrası tam **13** OEM broşür satırı sorguyla doğrulandı.
- Anonim kullanıcıyla `public.tractorvs_public_specs` görünümünde **20/20 görünür teknik alan, 13/13 exact OEM PDF URL, 0 doğrulama zamanı boş, 20/20 benzersiz `canonical_key`** ölçüldü.

## SEO ve dağıtımda ayrı doğrulama gerekir

**Doğru gerçek model adresi:** `https://tractorvs.com/tr/tractors/agrale-7215-5d2edc98/`. `public.tc_tractor_seo.slug` tablosundaki tarihî `agrale-7215-catalog-listing-review-global-...` değeri geçerli Astro dosya yolu **değildir**; o hatalı bağlantının 404 sonucu üretim sayfası kaybı değildir. Kod `site/src/lib/catalog.ts` satır 443-444'te marka + model + UUID'nin ilk 8 karakterini kullanır. Slug/redirect değiştirilmedi.

Kaynak DB'ye işlendiği anda canlı Cloudflare statik HTML hâlâ yalnız **7** eski üretici onaylı kaydı görüntülüyordu. Bu kanıt dosyasının kontrollü ana dal merge'i, **normal Cloudflare üretim derlemesi tetiklensin** ve 13 yeni OEM alanı canlıya alınsın diye hazırlanmıştır. **Merge veya CI başarılı olması canlı dağıtım kanıtı değildir.** Ayrı olarak:
1. Site CI, production bundle, Altın Kural ve gereken mobil/çoklu tarayıcı testlerinden geçer.
2. Gerçek TR/EN Agrale 7215 adreslerinde **HTTP 200**, canonical/hreflang, H1, model UUID/yıl/varyant kimliği, kaynak bağlantısının resmî host'a gitmesi ve **20/20 teknik alan** kontrol edilir.
3. Kaynak linklerinin `source_type=official_technical_pdf` olarak **üretici belgesine dayalı** şekilde etiketlendiği; düşük kanıtlı başka model alanlarının yanlış terfi ettirilmediği kontrol edilir.
4. Gerekirse bu dokümantasyon commit'i geri alınabilir; DB kayıtlarının geri alınması ayrı planlı bir işlem ve önceden özgün kaynak kayıtlarının bulunduğu sürüm geçmişiyle mutabakat gerektirir.

**Açık kalan çelişkiler:** [#490 Agrale 6185: 126 vs 105 L/dk ve 7.020 vs 8.820 kg](https://github.com/onuronkol2-collab/tractorcompare-data/issues/490); [#192 genel yayımlanmış model kaynak/durum QA](https://github.com/onuronkol2-collab/tractorcompare-data/issues/192). 6185’in 16 belirsiz alanına kanıt olmadan tarih veya değer yazılmadı.