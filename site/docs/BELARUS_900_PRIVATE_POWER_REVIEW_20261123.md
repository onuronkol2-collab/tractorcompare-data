# TractorVS — Belarus 900 güç bilgisi: özel inceleme kuyruğu

**Tarih:** 23 Kasım 2026. **Değişiklik türü:** Supabase'de beş *özel* teknik özellik adayı; kullanıcıya görünen `tractor_specs`, `tractors.horsepower`, RLS/şema, site kodu ve Cloudflare yayını değiştirilmedi.

## Gerçek işlem

Önce [yedi modellik önceki inceleme](SEVEN_PUBLISHED_POWER_SOURCE_REVIEW_20261123.md), güncel `AGENTS.md`, mevcut model/varyant/motor satırları, mevcut güç satırı ve özel inceleme tablosu kontrol edildi. Ardından `public.tractorvs_spec_review_candidates` içine tam model + motor eşleşmesine göre **beş kayıt** eklendi. Hepsinin durumu **`needs_review`**; `approved`, `applied`, otomatik yayın veya üst düzey HP güncellemesi yapılmadı. İşlem sonrası veriler bağımsız bir **READ ONLY** sorguyla tekrar denetlendi.

| Kayıtlı yayımlanmış model / motor | Özel nominal güç adayı | Özel işletme gücü adayı | İnceleme durumu |
| --- | --- | --- | --- |
| BELARUS 922.4 / D-245.5S3A, Stage IIIa | 70 kW (katalog, p.23) | Yok; uydurulmadı | Ayrı Deutz / MMZ seçenekleri ve katalog sütunu tam görsel doğrulaması tekrar kontrol edilmeli |
| BELARUS 923.3 / D-245.5S2, Stage II | 70 kW (2015 kullanım kılavuzu tablo 1.1.1, basılı s.12) | 66,7 ± 2,0 kW (aynı tablo) | Nominal / işletme kavramı ve varyant ayrımı korunmalı |
| BELARUS 952.4 / D-245.5S3A | 70,0 ± 2,0 kW (2012 ikinci baskı, tablo 1, basılı s.6) | 66,7 ± 2,0 kW (aynı tablo) | Nominal / işletme gücü ve kılavuz toleransı korunmalı |

**Kaynak kanıtı** (üretici tarafından düzenlenmiş, distribütörde barındırılan dokümanlar):
- 922.4: https://www.istokrtps.ru/catalog_images/traktory/MTZ922/MTZ_922.pdf
- 923.3: https://mtzavr.ru/wp-content/uploads/2023/09/re-belarus-923.3_923.4-2015.pdf
- 952.4: https://beltrakt.ru/upload/iblock/a08/akjfreahpb4ymrsd5d8tpg7mttw336a8.pdf

922.4 PDF metni ve önceki katalog incelemesi mevcut; bu oturumda PDF görüntüsünün yeniden yüklenmesi başarısız olduğu için tam görsel sütun doğrulaması tamamlandı denmez. 923.3 PDF'de model sütunları, orijinal sayfa 12'deki tablo metni ve ayrı 923.4 motor satırları incelendi; görüntü isteği önbellek hatası verdi. **952.4 PDF'de ilgili sayfa görseli açılarak** D-245.5S3A motorunun nominal 70,0 ± 2,0 kW ve işletme 66,7 ± 2,0 kW değerleri kontrol edildi. Kaynaklar **üretici beyanıdır**, bağımsız test veya ISO/ECE motor ölçüm belgesi olarak sunulmaz. Birimler `kW`, model/motor ve `±` toleransı aynen korunmuştur. Kaynaklar ve sınırlar önceki [Belarus kılavuz incelemesinde](SEVEN_PUBLISHED_POWER_SOURCE_REVIEW_20261123.md) ayrıca belgelenmiştir.

## Yayın / gizlilik koruması ve tekrar denetim

İşlemden sonra şu koşullar doğrulandı:

- Üç modelin `tractors.status` değeri **published**, fakat `tractors.horsepower` **NULL** olmaya devam ediyor; `tractor_specs` tablosunda bu yeni nominal/işletme güç anahtarlarından **0** yayımlanmış satır var.
- `922.4` için **1**, `923.3` için **2**, `952.4` için **2** özel aday mevcut ve hepsi `needs_review`.
- İnceleme tablosunun RLS'i **açık**; `anon` ve `authenticated` rollerinde doğrudan SELECT izni yok; özel tablo için RLS politikası yok. Bu, bu tablonun doğrudan normal Data API rollerine açık olmadığını gösterir, ancak tüm sunucu tarafı kodunun güvenlik denetiminin yerine geçmez.
- `AGENTS.md`, Cloudflare dağıtımı, forum, fotoğraf lisansları, on dil, kanonik URL'ler veya SEO sayfaları değiştirilmedi.

[Tekrar çalıştırılabilir salt-okunur SQL](../../supabase/verification/20261123_belarus_900_private_power_review_audit.sql) beş adayın kaynak, tür, varyant ve gizlilik koşullarını denetler.

**Yayınlama için ek kapı:** Özellikle 922.4'ün alternatif motorlarının kaynak belgesi ve yıl/pazar kapsamı netleşmeli. Diğer modellerde standart/beyan türü, on dilde teknik etiketler, canlı katalogdaki görünür bilgi ve RLS negatif testleri ayrıca kontrol edilmeli. `needs_review` kayıtları `tractor_specs` tablosuna taşınmadan önce mevcut onay ve geri alma süreçlerinden geçmelidir. `70 kW` otomatik olarak tek bir kesin SAE HP rakamına çevrilmeyecek ve `66,7 ± 2,0 kW` işletme gücü nominal güç yerine gösterilmeyecek.

**Cloudflare canlı yayın:** Bu oturumdaki doğrudan web/HTTP denemeleri siteyi bağımsız doğrulamak için yeterli olmadı; GitHub PR ve derleme başarısı gerçek üretim dağıtımı kanıtı değildir. Canlı yayın teyidi için Cloudflare sürüm/SHA, gerçek HTTP HTML ve dağıtım zamanının çapraz kontrolü hâlâ gerekli.
